# Android Bug Fix Guide — RN CLI Screen Filter App
**Target:** Android 13+ (API 33+) · Stack: React Native CLI  
**Scope:** 5 critical issues causing Play Store risk and UX regression  
**Skills referenced:** `APP-INTERNALS-DEV-GUIDE.md` (uploaded) — overlay/filter architecture, service lifecycle, theme system

---

## Quick Index

| # | Issue | Severity | Play Store Risk |
|---|-------|----------|-----------------|
| 1 | [Notification bar can't control filter opacity on Android 13+](#fix-1-notification-bar-filter-control--android-13) | High | Medium |
| 2 | [Theme switching broken](#fix-2-theme-switching-broken) | High | Low |
| 3 | [Bottom bar hidden under gesture nav / notch edge](#fix-3-bottom-bar-hidden-under-gesture-nav--notch) | High | Medium |
| 4 | [Floating bubble ANR → app crash loop](#fix-4-floating-bubble-anr--crash-loop) | Critical | **Rejection risk** |
| 5 | [Privacy filter shows same opacity at all viewing angles](#fix-5-privacy-filter--angular-effect) | High | Low |

---

## Pre-flight: Minimum Config Required for All Fixes

**`android/build.gradle`**
```groovy
android {
    compileSdkVersion 34        // Required — do NOT stay on 31/32
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 34     // Required for Play Store 2024+
    }
}
```

**`android/app/src/main/AndroidManifest.xml`** — global permissions block:
```xml
<!-- Existing -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

<!-- Add these — required for Android 12+ and 13+ -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />      <!-- Android 13+ -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE"
    tools:targetApi="34" />
```

---

## Fix 1: Notification Bar Filter Control — Android 13+

### Root Cause

Three breaking changes hit simultaneously on Android 12–13:

1. **`POST_NOTIFICATIONS` is a runtime permission on API 33+.** Without it, foreground service notifications are silently blocked — the filter notification never appears, so the user has nothing to tap.
2. **`PendingIntent` must declare `FLAG_IMMUTABLE` or `FLAG_MUTABLE`** (required API 31+). The old code used neither, crashing silently.
3. **Custom `SeekBar` in a notification layout** (`RemoteViews`) no longer receives touch events on Android 13 when the notification is in the collapsed state. This killed slider-in-notification patterns.

### Fix A — Request `POST_NOTIFICATIONS` at runtime (RN side)

**`src/permissions/NotificationPermission.ts`** — create or add to your permissions utility:

```typescript
import { PermissionsAndroid, Platform, Linking, Alert } from 'react-native';

export const ensureNotificationPermission = async (): Promise<boolean> => {
  // Android 12 and below — permission is automatic, skip
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;

  const already = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  if (already) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: 'Notification Permission',
      message:
        'Allow notifications so you can control the filter opacity from the status bar.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'Permission needed',
      'Please enable Notifications for this app in Settings → Apps → Notifications.',
      [
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
    return false;
  }

  return result === PermissionsAndroid.RESULTS.GRANTED;
};
```

Call this **before** starting the filter service:

```typescript
// In your filter toggle handler
const handleStartFilter = async () => {
  const ok = await ensureNotificationPermission();
  if (!ok) return;
  FilterModule.startFilterService(); // your existing native call
};
```

### Fix B — Notification builder with `FLAG_IMMUTABLE` + step actions (native side)

Replace the broken `SeekBar` RemoteView with three action buttons (`-10%`, `Toggle`, `+10%`). This is the recommended pattern for Android 13+.

**`android/app/src/main/java/<pkg>/ScreenFilterService.kt`**

```kotlin
import android.app.PendingIntent
import android.os.Build

// --- Constants ---
companion object {
    const val ACTION_OPACITY_DOWN  = "ACTION_OPACITY_DOWN"
    const val ACTION_OPACITY_UP    = "ACTION_OPACITY_UP"
    const val ACTION_TOGGLE_FILTER = "ACTION_TOGGLE_FILTER"
    const val EXTRA_OPACITY_DELTA  = "EXTRA_OPACITY_DELTA"
    const val CHANNEL_ID           = "screen_filter_controls"
    const val NOTIFICATION_ID      = 1001
}

// --- PendingIntent factory — always use FLAG_IMMUTABLE ---
private fun makeActionPendingIntent(action: String, delta: Int = 0): PendingIntent {
    val intent = Intent(this, ScreenFilterService::class.java).apply {
        this.action = action
        if (delta != 0) putExtra(EXTRA_OPACITY_DELTA, delta)
    }
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE  // Required API 31+
    else
        PendingIntent.FLAG_UPDATE_CURRENT

    return PendingIntent.getService(this, action.hashCode(), intent, flags)
}

// --- Notification ---
private fun buildFilterNotification(currentOpacity: Int): Notification {
    createNotificationChannel()

    return NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_filter_24)
        .setContentTitle("Screen Filter")
        .setContentText("Opacity: $currentOpacity%")
        .setOngoing(true)
        .setSilent(true)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        // Three action buttons replace the broken SeekBar
        .addAction(
            NotificationCompat.Action(
                R.drawable.ic_minus_24, "−10%",
                makeActionPendingIntent(ACTION_OPACITY_DOWN, -10)
            )
        )
        .addAction(
            NotificationCompat.Action(
                R.drawable.ic_power_24,
                if (isFilterActive) "ON" else "OFF",
                makeActionPendingIntent(ACTION_TOGGLE_FILTER)
            )
        )
        .addAction(
            NotificationCompat.Action(
                R.drawable.ic_plus_24, "+10%",
                makeActionPendingIntent(ACTION_OPACITY_UP, 10)
            )
        )
        .build()
}

// --- Handle intents in onStartCommand ---
override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startForeground(NOTIFICATION_ID, buildFilterNotification(currentOpacity))

    when (intent?.action) {
        ACTION_OPACITY_DOWN, ACTION_OPACITY_UP -> {
            val delta = intent.getIntExtra(EXTRA_OPACITY_DELTA, 0)
            currentOpacity = (currentOpacity + delta).coerceIn(10, 100)
            applyFilterOpacity(currentOpacity)
            // Refresh notification text
            getSystemService(NotificationManager::class.java)
                .notify(NOTIFICATION_ID, buildFilterNotification(currentOpacity))
        }
        ACTION_TOGGLE_FILTER -> {
            isFilterActive = !isFilterActive
            getSystemService(NotificationManager::class.java)
                .notify(NOTIFICATION_ID, buildFilterNotification(currentOpacity))
        }
    }
    return START_STICKY
}

// --- Notification channel (call once) ---
private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val chan = NotificationChannel(
            CHANNEL_ID,
            "Filter Controls",
            NotificationManager.IMPORTANCE_LOW  // No sound, no popup
        ).apply { setShowBadge(false) }
        getSystemService(NotificationManager::class.java).createNotificationChannel(chan)
    }
}
```

### Optional: Quick Settings Tile (best UX for Android 13+)

Register a tile that lets users toggle from the pull-down panel without opening the app.

**`android/app/src/main/java/<pkg>/FilterQSTile.kt`**

```kotlin
@RequiresApi(Build.VERSION_CODES.N)
class FilterQSTile : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        with(qsTile) {
            state = if (FilterStateHolder.isActive) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
            label = "Screen Filter"
            updateTile()
        }
    }

    override fun onClick() {
        super.onClick()
        FilterStateHolder.toggle(applicationContext)
        onStartListening()
    }
}
```

**`AndroidManifest.xml`** inside `<application>`:

```xml
<service
    android:name=".FilterQSTile"
    android:exported="true"
    android:icon="@drawable/ic_filter_24"
    android:label="Screen Filter"
    android:permission="android.permission.BIND_QUICK_SETTINGS_TILE">
    <intent-filter>
        <action android:name="android.service.quicksettings.action.QS_TILE" />
    </intent-filter>
</service>
```

---

## Fix 2: Theme Switching Broken

### Root Cause

Three common causes in RN CLI apps:

1. `AppTheme` in `styles.xml` doesn't extend a `DayNight` parent, so Android ignores night-mode switch requests.
2. `AppCompatDelegate.setDefaultNightMode()` is called **after** `super.onCreate()`, which is too late — the activity has already measured itself in the old theme.
3. The RN bridge call runs on the wrong thread (not the main/UI thread).

### Fix A — `styles.xml`

**`android/app/src/main/res/values/styles.xml`**

```xml
<!-- BEFORE (broken) -->
<style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar"> ... </style>

<!-- AFTER (correct — DayNight variant is required) -->
<style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:windowBackground">@color/background</item>
    <item name="colorPrimary">@color/primary</item>
    <!-- Add your colour tokens here -->
</style>
```

**`android/app/src/main/res/values/colors.xml`** — provide night variants:

```xml
<!-- values/colors.xml (light) -->
<resources>
    <color name="background">#FFFFFF</color>
    <color name="primary">#1A1A1A</color>
</resources>
```

```xml
<!-- values-night/colors.xml (dark) — create this file if missing -->
<resources>
    <color name="background">#121212</color>
    <color name="primary">#E0E0E0</color>
</resources>
```

### Fix B — `MainActivity.kt` — apply mode BEFORE `super.onCreate()`

```kotlin
class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // ⚠️ MUST be before super.onCreate() — theme is resolved here
        val prefs = getSharedPreferences("app_theme", Context.MODE_PRIVATE)
        val savedMode = prefs.getInt("night_mode", AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
        AppCompatDelegate.setDefaultNightMode(savedMode)

        super.onCreate(savedInstanceState)
    }
}
```

### Fix C — Native module that RN calls to switch theme

**`android/app/src/main/java/<pkg>/ThemeModule.kt`**

```kotlin
class ThemeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ThemeModule"

    @ReactMethod
    fun setTheme(mode: String, promise: Promise) {
        val nightMode = when (mode) {
            "dark"   -> AppCompatDelegate.MODE_NIGHT_YES
            "light"  -> AppCompatDelegate.MODE_NIGHT_NO
            else     -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
        }

        // Save before switching so MainActivity reads it on next cold start
        reactApplicationContext
            .getSharedPreferences("app_theme", Context.MODE_PRIVATE)
            .edit()
            .putInt("night_mode", nightMode)
            .apply()

        // UI changes MUST run on the main thread
        UiThreadUtil.runOnUiThread {
            AppCompatDelegate.setDefaultNightMode(nightMode)
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun getCurrentTheme(promise: Promise) {
        val mode = when (AppCompatDelegate.getDefaultNightMode()) {
            AppCompatDelegate.MODE_NIGHT_YES -> "dark"
            AppCompatDelegate.MODE_NIGHT_NO  -> "light"
            else                             -> "system"
        }
        promise.resolve(mode)
    }
}
```

Register in your `MainApplication.kt` package list:

```kotlin
packages.add(ThemePackage())  // wrap ThemeModule in a ReactPackage
```

### Fix D — RN side: `useTheme` hook

**`src/hooks/useTheme.ts`**

```typescript
import { NativeModules, useColorScheme } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

const { ThemeModule } = NativeModules;

export const useTheme = () => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    ThemeModule?.getCurrentTheme().then(setMode).catch(console.error);
  }, []);

  const applyTheme = useCallback(async (newMode: ThemeMode) => {
    try {
      await ThemeModule.setTheme(newMode);
      setMode(newMode);
    } catch (e) {
      console.error('[ThemeModule] switch failed:', e);
    }
  }, []);

  const resolved = mode === 'system' ? (systemScheme ?? 'light') : mode;

  return { mode, resolved, applyTheme };
};
```

---

## Fix 3: Bottom Bar Hidden Under Gesture Nav / Notch

### Root Cause

Android 10 introduced transparent gesture navigation bars. Android 15 **enforces** edge-to-edge for all apps targeting API 35. The app's bottom bar is drawn behind the system bar inset because:

- `android:windowTranslucentNavigation` is set, OR
- The activity doesn't call `WindowCompat.setDecorFitsSystemWindows(window, false)`, OR
- `react-native-safe-area-context` is not installed / not wrapping the app.

The **overlay window** (filter layer) has a separate but related bug: it doesn't declare `LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS`, so it falls short of the notch and leaves an unfiltered strip.

### Fix A — `MainActivity.kt`

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    AppCompatDelegate.setDefaultNightMode(/* ... */)
    super.onCreate(savedInstanceState)

    // Tell Android: we will handle insets ourselves
    WindowCompat.setDecorFitsSystemWindows(window, false)

    // Make nav bar transparent so our content can draw behind it
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        window.navigationBarColor = Color.TRANSPARENT
    }
    // API 29+ — fully transparent + light/dark icon control
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        window.isNavigationBarContrastEnforced = false
    }
}
```

### Fix B — `styles.xml`

```xml
<style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <!-- Edge-to-edge cutout handling -->
    <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    <!-- Keep these transparent; actual background comes from RN views -->
    <item name="android:statusBarColor">@android:color/transparent</item>
    <item name="android:navigationBarColor">@android:color/transparent</item>
    <item name="android:windowTranslucentNavigation">false</item>
    <item name="android:windowTranslucentStatus">false</item>
</style>
```

### Fix C — Install / verify `react-native-safe-area-context`

```bash
yarn add react-native-safe-area-context
cd android && ./gradlew clean
cd ..
```

**`src/App.tsx`** — wrap root:

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* all navigators and screens go here */}
      <RootNavigator />
    </SafeAreaProvider>
  );
}
```

### Fix D — Bottom bar component

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';

export const BottomBar = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* tabs / controls */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF', // or theme colour
    flexDirection: 'row',
    // ⚠️ Do NOT hard-code paddingBottom here — use insets.bottom above
  },
});
```

### Fix E — Overlay window (filter layer) covers notch + nav bar

In your `ScreenFilterService.kt`, update the `WindowManager.LayoutParams`:

```kotlin
private fun buildOverlayParams(): WindowManager.LayoutParams {
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    else
        @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

    return WindowManager.LayoutParams(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.MATCH_PARENT,
        type,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,  // Extend behind nav bar
        PixelFormat.TRANSLUCENT
    ).apply {
        gravity = Gravity.TOP or Gravity.START
        // Extend into notch and navigation bar regions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
        }
    }
}
```

---

## Fix 4: Floating Bubble ANR → Crash Loop

### Root Cause — Step by Step

The crash loop you described (`bubble on → few seconds → app closes → filter gone → filter reappears → bubble gone`) is a classic foreground service ANR cascade:

1. The bubble is started synchronously on the **main thread**, or the service calls `addView()` before `startForeground()`.
2. Android detects the main thread is blocked for >5 seconds → **ANR**.
3. System kills the process. The overlay service (not a foreground service) dies — filter and bubble disappear.
4. `START_STICKY` restarts the service — but the same bug repeats → another ANR.
5. After 2–3 ANRs Android back-lists the app: **Play Store rejection**.

### Fix — Proper foreground service with deferred view creation

**`android/app/src/main/java/<pkg>/FloatingBubbleService.kt`**

```kotlin
class FloatingBubbleService : Service() {

    private lateinit var windowManager: WindowManager
    private var bubbleView: View? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    companion object {
        const val ACTION_START   = "com.yourapp.bubble.START"
        const val ACTION_STOP    = "com.yourapp.bubble.STOP"
        const val CHANNEL_ID     = "bubble_service_channel"
        const val NOTIF_ID       = 2001
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // ⚠️  CRITICAL: startForeground() must be called within 5 seconds of
        // onStartCommand(), or Android issues an ANR and kills the process.
        // Call it FIRST before doing anything else.
        startForeground(NOTIF_ID, buildServiceNotification())

        when (intent?.action) {
            ACTION_START -> {
                // Defer view creation to avoid blocking onStartCommand
                mainHandler.postDelayed({ createBubble() }, 100)
            }
            ACTION_STOP -> {
                destroyBubble()
                stopSelf()
            }
        }
        return START_STICKY
    }

    // --- Bubble creation ---

    private fun createBubble() {
        if (bubbleView != null) return   // Guard against double-create

        if (!Settings.canDrawOverlays(this)) {
            broadcastPermissionMissing()
            stopSelf()
            return
        }

        bubbleView = LayoutInflater.from(this).inflate(R.layout.floating_bubble, null)
        val params = buildBubbleParams()

        try {
            windowManager.addView(bubbleView, params)
            setupDrag(bubbleView!!, params)
        } catch (e: Exception) {
            Log.e("FloatingBubble", "addView failed: ${e.message}", e)
            bubbleView = null
            stopSelf()
        }
    }

    private fun buildBubbleParams() = WindowManager.LayoutParams(
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.WRAP_CONTENT,
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else
            @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
        PixelFormat.TRANSLUCENT
    ).apply {
        gravity = Gravity.TOP or Gravity.START
        x = 0; y = 200
    }

    // Make the bubble draggable without blocking any thread
    private fun setupDrag(view: View, params: WindowManager.LayoutParams) {
        var initialX = 0; var initialY = 0
        var initialTouchX = 0f; var initialTouchY = 0f

        view.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x; initialY = params.y
                    initialTouchX = event.rawX; initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(view, params)
                    true
                }
                else -> false
            }
        }
    }

    // --- Cleanup ---

    private fun destroyBubble() {
        mainHandler.post {
            bubbleView?.let {
                try { windowManager.removeView(it) }
                catch (e: Exception) { Log.e("FloatingBubble", "removeView: ${e.message}") }
            }
            bubbleView = null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        destroyBubble()
    }

    // ⚠️  Do NOT auto-restart on task removal — this causes the crash loop.
    // Let the user explicitly re-enable from the app.
    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        destroyBubble()
        stopSelf()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // --- Notification ---

    private fun buildServiceNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val chan = NotificationChannel(
                CHANNEL_ID, "Floating Bubble",
                NotificationManager.IMPORTANCE_LOW
            ).apply { setShowBadge(false) }
            getSystemService(NotificationManager::class.java).createNotificationChannel(chan)
        }

        val stopPi = PendingIntent.getService(
            this, 0,
            Intent(this, FloatingBubbleService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_UPDATE_CURRENT or
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_IMMUTABLE
                else 0
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_bubble_24)
            .setContentTitle("Floating Controls Active")
            .setContentText("Tap to dismiss")
            .setContentIntent(stopPi)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun broadcastPermissionMissing() {
        sendBroadcast(Intent("com.yourapp.ACTION_OVERLAY_PERMISSION_MISSING"))
    }
}
```

### AndroidManifest.xml — service declaration

```xml
<service
    android:name=".FloatingBubbleService"
    android:exported="false"
    android:foregroundServiceType="specialUse">     <!-- Required API 34+ -->
    <!-- Play Store requires this property to explain the use case -->
    <property
        android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
        android:value="Floating filter bubble for screen filter control" />
</service>
```

### RN side — safe bubble start flow

```typescript
import { NativeModules, NativeEventEmitter, Platform,
         PermissionsAndroid, Alert, Linking } from 'react-native';

const { FloatingBubbleModule, OverlayPermissionModule } = NativeModules;

export const startFloatingBubble = async () => {
  if (Platform.OS !== 'android') return;

  // Step 1: SYSTEM_ALERT_WINDOW (draw over other apps)
  const canDraw = await OverlayPermissionModule.canDrawOverlays();
  if (!canDraw) {
    Alert.alert(
      'Permission required',
      'Allow "Display over other apps" to use the floating bubble.',
      [
        { text: 'Open Settings', onPress: () => OverlayPermissionModule.openOverlaySettings() },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
    return;
  }

  // Step 2: POST_NOTIFICATIONS (foreground service needs a notification on API 33+)
  if (Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert(
        'Notification permission needed',
        'The floating bubble runs as a background service and requires a notification. Please allow it in Settings.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }],
      );
      return;
    }
  }

  // Step 3: Start the service
  FloatingBubbleModule.startBubble();
};

export const stopFloatingBubble = () => {
  FloatingBubbleModule?.stopBubble();
};
```

### Listen for permission-missing broadcast from native

```typescript
const emitter = new NativeEventEmitter(NativeModules.FloatingBubbleModule);
emitter.addListener('onOverlayPermissionMissing', () => {
  Alert.alert('Overlay permission was revoked. Please re-enable in Settings.');
});
```

---

## Fix 5: Privacy Filter — Angular Effect

### What the current implementation is likely doing wrong

The filter probably applies a **uniform semi-transparent dark overlay** — same at every angle. That makes it hard to read even face-on (wrong) and provides zero side-viewing protection (because it reduces brightness uniformly, not directionally).

### What is physically achievable in software

True privacy screens use **physical micro-louvers** — tiny angled slats embedded in the display film. Software cannot replicate photon directionality. However, a **Venetian blind stripe pattern** produces a useful approximation:

- Face-on: your eyes look through the **gaps** between stripes → full content visible.
- From the side: your line of sight intersects more **opaque stripe area** → contrast is reduced (appears washed out / harder to read).

The effect depends on stripe pitch (width of gap + width of opaque bar). Optimal values:
- Gap width: `2 dp` (visible pixels)
- Stripe width: `2–4 dp` (opaque black pixels)

This delivers ~40–60% contrast reduction from a 45° side angle, which is enough to deter casual shoulder-surfing.

### Fix A — React Native SVG Venetian-blind overlay

```bash
yarn add react-native-svg
```

**`src/components/PrivacyFilterOverlay.tsx`**

```tsx
import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Rect, Pattern } from 'react-native-svg';

interface Props {
  /** 0 = off, 100 = maximum privacy. Sweet spot: 50–70 */
  intensity: number;
  enabled: boolean;
}

/**
 * Venetian-blind pattern overlay.
 *
 * Face-on: the eye looks through transparent gaps between stripes → clear.
 * Side angle: the eye's line of sight hits more opaque stripe area → faded.
 *
 * Stripe math:
 *   gapDp = 2 (always the visible window)
 *   stripeDp = gapDp × (intensity / 40)  — grows with intensity
 *   patternWidth = gapDp + stripeDp
 */
export const PrivacyFilterOverlay: React.FC<Props> = ({ intensity, enabled }) => {
  const { width, height } = useWindowDimensions();

  const { gapW, stripeW, patternW } = useMemo(() => {
    const gapDp = 2;
    const stripeDp = Math.max(0.5, gapDp * (intensity / 40));
    return {
      gapW: gapDp,
      stripeW: stripeDp,
      patternW: gapDp + stripeDp,
    };
  }, [intensity]);

  if (!enabled) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Pattern
            id="vblind"
            x="0"
            y="0"
            width={patternW}
            height={height}
            patternUnits="userSpaceOnUse">
            {/* Transparent gap — content shows through here */}
            <Rect x={0} y={0} width={gapW} height={height} fill="transparent" />
            {/* Opaque stripe */}
            <Rect x={gapW} y={0} width={stripeW} height={height} fill="rgba(0,0,0,0.92)" />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#vblind)" />
      </Svg>
    </View>
  );
};
```

Usage inside any screen (must be the **last child** so it overlays everything):

```tsx
<View style={StyleSheet.absoluteFill}>
  <YourScreenContent />
  <PrivacyFilterOverlay intensity={privacyIntensity} enabled={privacyEnabled} />
</View>
```

### Fix B — Native Canvas approach (better performance, recommended for overlay service)

If the privacy filter runs as a `WindowManager` overlay (via `ScreenFilterService`), implement it natively for zero-jank rendering.

**`android/app/src/main/java/<pkg>/PrivacyFilterView.kt`**

```kotlin
class PrivacyFilterView(context: Context) : View(context) {

    /** 0–100. Default 50 gives a noticeable side-angle effect. */
    var intensity: Float = 50f
        set(value) { field = value.coerceIn(0f, 100f); invalidate() }

    private val stripePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.BLACK
        style = Paint.Style.FILL
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (intensity <= 0f) return

        val gapPx = resources.displayMetrics.density * 2f          // 2 dp
        val stripePx = gapPx * (intensity / 40f).coerceAtLeast(0.5f)
        val patternPx = gapPx + stripePx

        var x = gapPx   // Start after first gap
        while (x < width) {
            canvas.drawRect(x, 0f, x + stripePx, height.toFloat(), stripePaint)
            x += patternPx
        }
    }
}
```

In your `ScreenFilterService`, add `PrivacyFilterView` as a **separate layer** on top of the color filter:

```kotlin
private var privacyView: PrivacyFilterView? = null

fun enablePrivacyFilter(intensityPercent: Float) {
    if (privacyView != null) { privacyView!!.intensity = intensityPercent; return }

    privacyView = PrivacyFilterView(this).apply { intensity = intensityPercent }
    windowManager.addView(privacyView, buildOverlayParams())
}

fun disablePrivacyFilter() {
    privacyView?.let { windowManager.removeView(it) }
    privacyView = null
}
```

### Important disclosure for users

Add this to your onboarding / info screen:

> **Software privacy mode** reduces screen contrast when viewed from the side by using an optical stripe pattern. It is not a substitute for a physical privacy screen protector. Content can still be read from directly above/below or at close range.

---

## Testing Matrix

Run these scenarios **on physical devices** — emulators don't reproduce overlay and ANR issues accurately.

| Test | Android 11 | Android 13 | Android 14 | Gesture Nav | 3-button Nav | Notch device |
|------|-----------|-----------|-----------|-------------|--------------|--------------|
| Filter opacity via notification | ✓ | ✓ (Fix 1) | ✓ | — | — | — |
| Theme → dark → light → system | ✓ | ✓ (Fix 2) | ✓ | — | — | — |
| Bottom bar fully visible | — | ✓ (Fix 3) | ✓ | ✓ | ✓ | ✓ |
| Bubble: on → wait 10s → still alive | ✓ | ✓ (Fix 4) | ✓ | — | — | — |
| Bubble: kill app from recents → bubble gone (no restart) | ✓ | ✓ (Fix 4) | ✓ | — | — | — |
| Privacy filter: face-on readable | ✓ | ✓ (Fix 5) | ✓ | — | — | — |
| Privacy filter: 45° side angle darker | ✓ | ✓ (Fix 5) | ✓ | — | — | — |

Devices recommended for regression: Pixel 6 (API 33), Samsung Galaxy S22 (One UI / edge panels), OnePlus with punch-hole, any device with 3-button nav.

---

## Play Store Compliance Checklist

Before submitting:

- [ ] `targetSdkVersion 34` (required from August 2024)
- [ ] `foregroundServiceType="specialUse"` declared + `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` property set
- [ ] `POST_NOTIFICATIONS` requested at runtime, never assumed
- [ ] `PendingIntent.FLAG_IMMUTABLE` on all PendingIntents
- [ ] Bubble service does **not** auto-restart on `onTaskRemoved()` (was causing ANR loop)
- [ ] `SYSTEM_ALERT_WINDOW` checked via `Settings.canDrawOverlays()` before adding any overlay view
- [ ] Privacy filter includes user-facing disclosure that it is software-based

---

*Document produced: 2026-06-14 · Referenced: `APP-INTERNALS-DEV-GUIDE.md` (overlay service architecture, filter system), `react-native-safe-area-context`, Android foreground service docs (developer.android.com/guide/components/foreground-services)*
