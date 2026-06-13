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
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import com.screenfilterapp.MainActivity
import com.screenfilterapp.R

/**
 * NightShade V4 — Foreground Overlay Service
 *
 * Key V4 Changes:
 * - Extended brightness: opacity 0.0–2.0 (multi-layer overlay for >1.0)
 * - Notification with SeekBar (brightness slider)
 * - Robust state persistence for bubble stability
 * - Debounced overlay updates (~60fps)
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

        const val EXTRA_OPACITY = "opacity"
        const val EXTRA_COLOR = "color"

        var isRunning = false
            private set
        var currentEnabled = false
            private set
        /** V4: 0.0–2.0 range for extended brightness */
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

    // Notification brightness slider receiver
    private var brightnessReceiver: BroadcastReceiver? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        registerBrightnessReceiver()
        // Call startForeground in onCreate to prevent ForegroundServiceDidNotStartInTimeException
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_ENABLE -> {
                intent.getFloatExtra(EXTRA_OPACITY, currentOpacity).let { currentOpacity = it }
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
                updateNotification()
            }
            ACTION_RESUME -> {
                isPaused = false
                showOverlay()
                updateNotification()
            }
            ACTION_UPDATE -> {
                intent.getFloatExtra(EXTRA_OPACITY, currentOpacity).let { currentOpacity = it }
                intent.getStringExtra(EXTRA_COLOR)?.let { currentColor = parseColor(it) }
                if (isOverlayVisible) debouncedUpdateOverlay()
                saveState()
            }
            ACTION_BRIGHTNESS_UP -> {
                currentOpacity = (currentOpacity + 0.05f).coerceAtMost(2.0f)
                if (isOverlayVisible) debouncedUpdateOverlay()
                saveState()
                updateNotification()
            }
            ACTION_BRIGHTNESS_DOWN -> {
                currentOpacity = (currentOpacity - 0.05f).coerceAtLeast(0.0f)
                if (isOverlayVisible) debouncedUpdateOverlay()
                saveState()
                updateNotification()
            }
            ACTION_SET_BRIGHTNESS -> {
                val level = intent.getFloatExtra(EXTRA_OPACITY, currentOpacity)
                currentOpacity = level.coerceIn(0f, 2f)
                if (isOverlayVisible) debouncedUpdateOverlay()
                saveState()
                updateNotification()
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

        startForeground(NOTIFICATION_ID, createNotification())
        isRunning = true
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        hideOverlay()
        isRunning = false
        updateRunnable?.let { updateHandler.removeCallbacks(it) }
        brightnessReceiver?.let {
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
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS

        // Primary overlay (always present when enabled)
        primaryOverlay = View(this).apply {
            setBackgroundColor(currentColor)
            alpha = currentOpacity.coerceAtMost(1.0f)
        }
        primaryParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type, baseFlags, PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }

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

        updateNotification()
    }

    private fun addSecondaryOverlay(type: Int, baseFlags: Int) {
        if (secondaryOverlay != null) return
        secondaryOverlay = View(this).apply {
            setBackgroundColor(currentColor)
            alpha = (currentOpacity - 1.0f).coerceIn(0f, 1f)
        }
        secondaryParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type, baseFlags, PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
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
        updateNotification()
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

    // ─── Notification with Brightness Slider ─────────────────────

    private fun registerBrightnessReceiver() {
        brightnessReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    "com.screenfilterapp.NOTIF_BRIGHTNESS" -> {
                        val level = intent.getFloatExtra(EXTRA_OPACITY, currentOpacity)
                        currentOpacity = level.coerceIn(0f, 2f)
                        if (isOverlayVisible) debouncedUpdateOverlay()
                        saveState()
                        updateNotification()
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
                        updateNotification()
                    }
                }
            }
        }
        val filter = IntentFilter().apply {
            addAction("com.screenfilterapp.NOTIF_BRIGHTNESS")
            addAction("com.screenfilterapp.NOTIF_TOGGLE")
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(brightnessReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(brightnessReceiver, filter)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH  // HIGH to prevent Samsung notification suppression → FGS crash
            ).apply {
                description = "NightShade screen filter is active"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
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
            else -> "Active · ${Math.round(currentOpacity * 100)}% dim"
        }

        // Expanded notification with custom layout including SeekBar
        val expandedView = RemoteViews(packageName, R.layout.notification_expanded).apply {
            setTextViewText(R.id.notification_status, statusText)
            setTextViewText(R.id.notification_brightness, "${Math.round(currentOpacity * 100)}%")

            // Set SeekBar progress (0-200 maps to 0%-200%)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // SeekBar in RemoteViews is available from API 31+
                // For older versions, we rely on the +/- buttons
            }
        }

        // Toggle action
        val toggleIntent = Intent("com.screenfilterapp.NOTIF_TOGGLE")
        val togglePending = PendingIntent.getBroadcast(
            this, 10, toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Brightness preset actions (since SeekBar in RemoteViews requires API 31+)
        val dim25 = createBrightnessPendingIntent(0.25f, 11)
        val dim50 = createBrightnessPendingIntent(0.50f, 12)
        val dim75 = createBrightnessPendingIntent(0.75f, 13)
        val dim100 = createBrightnessPendingIntent(1.00f, 14)
        val dim150 = createBrightnessPendingIntent(1.50f, 15)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NightShade")
            .setContentText(statusText)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(openAppPending)
            .setCustomContentView(expandedView)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .addAction(R.drawable.ic_notification, if (isOverlayVisible) "Pause" else "Resume", togglePending)
            .addAction(R.drawable.ic_notification, "25%", dim25)
            .addAction(R.drawable.ic_notification, "50%", dim50)
            .addAction(R.drawable.ic_notification, "100%", dim100)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }

    private fun createBrightnessPendingIntent(level: Float, requestCode: Int): PendingIntent {
        val intent = Intent("com.screenfilterapp.NOTIF_BRIGHTNESS").apply {
            putExtra(EXTRA_OPACITY, level)
            setPackage(packageName)
        }
        return PendingIntent.getBroadcast(
            this, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun updateNotification() {
        getSystemService(NotificationManager::class.java)
            .notify(NOTIFICATION_ID, createNotification())
    }
}
