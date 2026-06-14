package com.screenfilterapp.overlay

import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.WindowManager
import android.view.View
import androidx.core.app.NotificationCompat
import com.screenfilterapp.MainActivity
import com.screenfilterapp.R

/**
 * NightShade V5 — Foreground Overlay Service
 *
 * Key V5 Changes:
 * - Extended brightness: opacity 0.0–2.0 (multi-layer overlay for >1.0)
 * - Notification with step action buttons (-10%, Toggle, +10%) for Android 13+ compat
 * - FLAG_IMMUTABLE on all PendingIntents (required API 31+)
 * - Robust state persistence for bubble stability
 * - Debounced overlay updates (~60fps)
 * - Overlay covers notch and navigation bar (LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS)
 */
class OverlayService : Service() {

    companion object {
        const val CHANNEL_ID = "nightshade_filter_channel"
        const val CHANNEL_NAME = "NightShade Filter"
        const val NOTIFICATION_ID = 1001

        const val ACTION_ENABLE = "com.screenfilterapp.ENABLE"
        const val ACTION_DISABLE = "com.screenfilterapp.DISABLE"
        const val ACTION_TOGGLE = "com.screenfilterapp.TOGGLE"
        const val ACTION_PAUSE = "com.screenfilterapp.PAUSE"
        const val ACTION_RESUME = "com.screenfilterapp.RESUME"
        const val ACTION_UPDATE = "com.screenfilterapp.UPDATE"
        const val ACTION_BRIGHTNESS_UP = "com.screenfilterapp.BRIGHTNESS_UP"
        const val ACTION_BRIGHTNESS_DOWN = "com.screenfilterapp.BRIGHTNESS_DOWN"
        const val ACTION_SET_BRIGHTNESS = "com.screenfilterapp.SET_BRIGHTNESS"
        const val ACTION_EMERGENCY_RESET = "com.screenfilterapp.EMERGENCY_RESET"

        // Notification step actions — replaces broken SeekBar RemoteViews on Android 13+
        const val ACTION_OPACITY_DOWN = "com.screenfilterapp.OPACITY_DOWN"
        const val ACTION_OPACITY_UP = "com.screenfilterapp.OPACITY_UP"
        const val ACTION_NOTIF_TOGGLE = "com.screenfilterapp.NOTIF_TOGGLE"
        const val EXTRA_OPACITY_DELTA = "opacity_delta"

        const val EXTRA_OPACITY = "opacity"
        const val EXTRA_COLOR = "color"

        /** Maximum safe opacity — prevents screen lockout.
         *  At 2.0 (200%) the screen is almost completely black and unusable.
         *  We cap at a safe maximum but still allow extended dimming.
         */
        const val MAX_SAFE_OPACITY = 1.80f  // 180% — dark but still usable

        var isRunning = false
            private set
        var currentEnabled = false
            private set
        /** V4: 0.0–MAX_SAFE_OPACITY range for extended brightness */
        var currentOpacity = 0.3f
            private set
        var currentColor = 0xFF000000.toInt()
            private set
    }

    private var windowManager: WindowManager? = null
    // V4: Primary and secondary overlay views for extended brightness (>1.0)
    private var primaryOverlay: View? = null
    private var secondaryOverlay: View? = null
    private var primaryParams: WindowManager.LayoutParams? = null
    private var secondaryParams: WindowManager.LayoutParams? = null
    private var isOverlayVisible = false
    private var isPaused = false

    // Debounce handler for overlay updates (~60fps)
    private val updateHandler = Handler(Looper.getMainLooper())
    private var updateRunnable: Runnable? = null
    private val DEBOUNCE_DELAY = 16L

    // SharedPreferences for boot receiver & bubble stability
    private val prefs by lazy {
        getSharedPreferences("nightshade_prefs", MODE_PRIVATE)
    }

    // Notification action receiver
    private var notificationReceiver: BroadcastReceiver? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        registerNotificationReceiver()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // ⚠️ CRITICAL: startForeground() must be called within 5 seconds of
        // onStartCommand(), or Android issues an ANR and kills the process.
        // Call it FIRST before doing anything else.
        startForeground(NOTIFICATION_ID, buildFilterNotification())

        when (intent?.action) {
            ACTION_ENABLE -> {
                val requestedOpacity = intent.getFloatExtra(EXTRA_OPACITY, currentOpacity)
                currentOpacity = requestedOpacity.coerceIn(0f, MAX_SAFE_OPACITY)
                intent.getStringExtra(EXTRA_COLOR)?.let { currentColor = parseColor(it) }
                currentEnabled = true
                showOverlay()
                saveState()
            }
            ACTION_DISABLE -> {
                currentEnabled = false
                hideOverlay()
                saveState()
            }
            ACTION_TOGGLE -> {
                if (isOverlayVisible && !isPaused) {
                    currentEnabled = false
                    hideOverlay()
                } else {
                    currentEnabled = true
                    showOverlay()
                }
                saveState()
            }
            ACTION_PAUSE -> {
                isPaused = true
                hideOverlay()
                refreshNotification()
            }
            ACTION_RESUME -> {
                isPaused = false
                showOverlay()
                refreshNotification()
            }
            ACTION_UPDATE -> {
                val requestedOpacity = intent.getFloatExtra(EXTRA_OPACITY, currentOpacity)
                currentOpacity = requestedOpacity.coerceIn(0f, MAX_SAFE_OPACITY)
                intent.getStringExtra(EXTRA_COLOR)?.let { currentColor = parseColor(it) }
                if (isOverlayVisible) debouncedUpdateOverlay()
                saveState()
            }
            ACTION_BRIGHTNESS_UP -> {
                currentOpacity = (currentOpacity + 0.05f).coerceAtMost(MAX_SAFE_OPACITY)
                if (isOverlayVisible) debouncedUpdateOverlay()
                saveState()
                refreshNotification()
            }
            ACTION_BRIGHTNESS_DOWN -> {
                currentOpacity = (currentOpacity - 0.05f).coerceAtLeast(0.0f)
                if (isOverlayVisible) debouncedUpdateOverlay()
                saveState()
                refreshNotification()
            }
            ACTION_SET_BRIGHTNESS -> {
                val level = intent.getFloatExtra(EXTRA_OPACITY, currentOpacity)
                currentOpacity = level.coerceIn(0f, MAX_SAFE_OPACITY)
                if (isOverlayVisible) debouncedUpdateOverlay()
                saveState()
                refreshNotification()
            }
            ACTION_EMERGENCY_RESET -> {
                // Emergency: reduce opacity to safe level if user is locked out
                currentOpacity = 0.5f
                currentEnabled = true
                if (isOverlayVisible) updateOverlay() else showOverlay()
                saveState()
                refreshNotification()
            }
            // Notification step action: −10%
            ACTION_OPACITY_DOWN -> {
                val delta = intent.getIntExtra(EXTRA_OPACITY_DELTA, -10)
                currentOpacity = ((currentOpacity * 100 + delta) / 100f).coerceIn(0f, MAX_SAFE_OPACITY)
                if (isOverlayVisible) debouncedUpdateOverlay()
                saveState()
                refreshNotification()
            }
            // Notification step action: +10%
            ACTION_OPACITY_UP -> {
                val delta = intent.getIntExtra(EXTRA_OPACITY_DELTA, 10)
                currentOpacity = ((currentOpacity * 100 + delta) / 100f).coerceIn(0f, MAX_SAFE_OPACITY)
                if (isOverlayVisible) debouncedUpdateOverlay()
                saveState()
                refreshNotification()
            }
            // Notification toggle action
            ACTION_NOTIF_TOGGLE -> {
                if (isOverlayVisible && !isPaused) {
                    currentEnabled = false
                    hideOverlay()
                } else {
                    currentEnabled = true
                    showOverlay()
                }
                saveState()
                refreshNotification()
            }
            else -> {
                // Restore from saved state if available
                if (prefs.getBoolean("was_overlay_enabled", false) && !isOverlayVisible) {
                    currentOpacity = prefs.getFloat("last_opacity", 0.3f)
                    val savedColor = prefs.getString("last_color", "#FF000000")
                    savedColor?.let { currentColor = parseColor(it) }
                    currentEnabled = true
                    showOverlay()
                }
            }
        }

        isRunning = true
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        hideOverlay()
        isRunning = false
        updateRunnable?.let { updateHandler.removeCallbacks(it) }
        notificationReceiver?.let {
            try { unregisterReceiver(it) } catch (_: Exception) {}
        }
        windowManager = null
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Restart service if filter is active (survives app swipe-away)
        if (currentEnabled) {
            val restartIntent = Intent(this, OverlayService::class.java).apply {
                action = ACTION_ENABLE
                putExtra(EXTRA_OPACITY, currentOpacity)
                putExtra(EXTRA_COLOR, colorToHex(currentColor))
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(restartIntent)
            } else {
                startService(restartIntent)
            }
        }
        super.onTaskRemoved(rootIntent)
    }

    // ─── Overlay Management (V4: Multi-layer for extended brightness) ─

    private fun showOverlay() {
        if (primaryOverlay != null) {
            updateOverlay()
            return
        }

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_SYSTEM_ALERT
        }

        val baseFlags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS

        // Primary overlay (always present when enabled)
        primaryOverlay = View(this).apply {
            setBackgroundColor(currentColor)
            alpha = currentOpacity.coerceAtMost(1.0f)
        }
        primaryParams = buildOverlayParams(type, baseFlags)

        try {
            windowManager?.addView(primaryOverlay, primaryParams)
            isOverlayVisible = true
            isPaused = false
        } catch (e: Exception) {
            isOverlayVisible = false
            return
        }

        // Secondary overlay for extended brightness (>1.0)
        if (currentOpacity > 1.0f) {
            addSecondaryOverlay(type, baseFlags)
        }

        refreshNotification()
    }

    /**
     * Build overlay layout params with cutout and edge-to-edge support.
     * Uses LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS on API 29+ so the filter
     * extends into the notch/punch-hole region with no unfiltered strip.
     */
    private fun buildOverlayParams(type: Int, baseFlags: Int): WindowManager.LayoutParams {
        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type, baseFlags, PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            // Extend into notch and navigation bar regions
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
    }

    private fun addSecondaryOverlay(type: Int, baseFlags: Int) {
        if (secondaryOverlay != null) return
        secondaryOverlay = View(this).apply {
            setBackgroundColor(currentColor)
            alpha = (currentOpacity - 1.0f).coerceIn(0f, 1f)
        }
        secondaryParams = buildOverlayParams(type, baseFlags)
        try {
            windowManager?.addView(secondaryOverlay, secondaryParams)
        } catch (e: Exception) {
            secondaryOverlay = null
        }
    }

    private fun removeSecondaryOverlay() {
        try { secondaryOverlay?.let { windowManager?.removeView(it) } } catch (_: Exception) {}
        secondaryOverlay = null
        secondaryParams = null
    }

    private fun hideOverlay() {
        try { primaryOverlay?.let { windowManager?.removeView(it) } } catch (_: Exception) {}
        primaryOverlay = null
        primaryParams = null
        removeSecondaryOverlay()
        isOverlayVisible = false
        refreshNotification()
    }

    private fun updateOverlay() {
        // Update primary overlay
        primaryOverlay?.let { view ->
            try {
                view.setBackgroundColor(currentColor)
                view.alpha = currentOpacity.coerceAtMost(1.0f)
            } catch (_: Exception) {}
        }

        // Handle secondary overlay for extended brightness
        if (currentOpacity > 1.0f) {
            if (secondaryOverlay == null) {
                // Need to add secondary overlay
                val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_SYSTEM_ALERT
                }
                val baseFlags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                addSecondaryOverlay(type, baseFlags)
            } else {
                try {
                    secondaryOverlay?.setBackgroundColor(currentColor)
                    secondaryOverlay?.alpha = (currentOpacity - 1.0f).coerceIn(0f, 1f)
                } catch (_: Exception) {}
            }
        } else {
            // Remove secondary overlay if opacity <= 1.0
            removeSecondaryOverlay()
        }
    }

    /** Debounced overlay update for performance — targets ~16ms frame time */
    private fun debouncedUpdateOverlay() {
        updateRunnable?.let { updateHandler.removeCallbacks(it) }
        updateRunnable = Runnable { updateOverlay() }
        updateHandler.postDelayed(updateRunnable!!, DEBOUNCE_DELAY)
    }

    // ─── Color Parsing ───────────────────────────────────────────

    private fun parseColor(colorString: String): Int {
        return try {
            val hex = if (colorString.startsWith("#")) {
                if (colorString.length == 7) "#FF${colorString.substring(1)}" else colorString
            } else "#FF000000"
            android.graphics.Color.parseColor(hex)
        } catch (_: Exception) { android.graphics.Color.parseColor("#FF000000") }
    }

    private fun colorToHex(color: Int): String {
        return String.format("#%08X", color)
    }

    // ─── State Persistence ───────────────────────────────────────

    private fun saveState() {
        prefs.edit().apply {
            putBoolean("was_overlay_enabled", currentEnabled)
            putFloat("last_opacity", currentOpacity)
            putString("last_color", colorToHex(currentColor))
            apply()
        }
    }

    // ─── Notification with Step Actions (Android 13+ compat) ────

    /**
     * Register receiver for notification step actions (−10%, Toggle, +10%).
     * Replaces the broken SeekBar-in-RemoteViews pattern that doesn't
     * receive touch events on Android 13+.
     */
    private fun registerNotificationReceiver() {
        notificationReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    "com.screenfilterapp.NOTIF_BRIGHTNESS" -> {
                        val level = intent.getFloatExtra(EXTRA_OPACITY, currentOpacity)
                        currentOpacity = level.coerceIn(0f, MAX_SAFE_OPACITY)
                        if (isOverlayVisible) debouncedUpdateOverlay()
                        saveState()
                        refreshNotification()
                    }
                    "com.screenfilterapp.NOTIF_TOGGLE" -> {
                        if (isOverlayVisible && !isPaused) {
                            currentEnabled = false
                            hideOverlay()
                        } else {
                            currentEnabled = true
                            showOverlay()
                        }
                        saveState()
                        refreshNotification()
                    }
                }
            }
        }
        val filter = IntentFilter().apply {
            addAction("com.screenfilterapp.NOTIF_BRIGHTNESS")
            addAction("com.screenfilterapp.NOTIF_TOGGLE")
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(notificationReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(notificationReceiver, filter)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "NightShade screen filter is active"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    /**
     * PendingIntent factory — always uses FLAG_IMMUTABLE on API 31+.
     * Required to prevent crashes on Android 12+.
     */
    private fun makeActionPendingIntent(action: String, delta: Int = 0): PendingIntent {
        val intent = Intent(this, OverlayService::class.java).apply {
            this.action = action
            if (delta != 0) putExtra(EXTRA_OPACITY_DELTA, delta)
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        else
            PendingIntent.FLAG_UPDATE_CURRENT

        return PendingIntent.getService(this, action.hashCode(), intent, flags)
    }

    /**
     * Build the filter notification with three step action buttons:
     * −10%, Toggle, +10%. This replaces the broken SeekBar-in-RemoteViews
     * pattern that doesn't receive touch events on Android 13+.
     */
    private fun buildFilterNotification(): Notification {
        val currentPct = Math.round(currentOpacity * 100)

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openAppPending = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val statusText = when {
            !isOverlayVisible -> "Inactive"
            isPaused -> "Paused"
            else -> "Active \u00B7 $currentPct% dim"
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NightShade")
            .setContentText(statusText)
            .setSmallIcon(R.drawable.ic_stat_nightshade)
            .setContentIntent(openAppPending)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            // Three action buttons replace the broken SeekBar RemoteViews
            .addAction(
                NotificationCompat.Action(
                    R.drawable.ic_stat_nightshade, "\u221210%",
                    makeActionPendingIntent(ACTION_OPACITY_DOWN, -10)
                )
            )
            .addAction(
                NotificationCompat.Action(
                    R.drawable.ic_stat_nightshade,
                    if (isOverlayVisible && !isPaused) "Pause" else "Resume",
                    makeActionPendingIntent(ACTION_NOTIF_TOGGLE)
                )
            )
            .addAction(
                NotificationCompat.Action(
                    R.drawable.ic_stat_nightshade, "+10%",
                    makeActionPendingIntent(ACTION_OPACITY_UP, 10)
                )
            )
            .build()
    }

    private fun refreshNotification() {
        getSystemService(NotificationManager::class.java)
            .notify(NOTIFICATION_ID, buildFilterNotification())
    }
}
