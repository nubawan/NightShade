package app.nightshade.screenfilter.overlay

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.*
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.TextView
import androidx.core.app.NotificationCompat
import app.nightshade.screenfilter.MainActivity
import app.nightshade.screenfilter.R

/**
 * NightShade V5 — Floating Bubble Service
 *
 * CRITICAL FIX: Proper foreground service to prevent ANR → crash loop.
 *
 * Key changes from V4:
 * - startForeground() is called FIRST in onStartCommand() before any other work
 * - View creation is deferred via Handler.postDelayed() to avoid blocking the main thread
 * - onTaskRemoved() does NOT auto-restart — prevents crash loop after ANR
 * - FLAG_IMMUTABLE on all PendingIntents (required API 31+)
 * - Separate notification channel from OverlayService
 *
 * Revamped with Void Architecture design tokens.
 */
class FloatingBubbleService : Service() {

    companion object {
        const val ACTION_SHOW = "app.nightshade.screenfilter.BUBBLE_SHOW"
        const val ACTION_HIDE = "app.nightshade.screenfilter.BUBBLE_HIDE"
        const val ACTION_STOP = "app.nightshade.screenfilter.BUBBLE_STOP"
        const val CHANNEL_ID = "bubble_service_channel"
        const val NOTIF_ID = 2001

        var isRunning = false
            private set

        // Void Architecture color tokens (matching theme/index.ts)
        private const val VOID_BLACK = 0xFF08090B.toInt()
        private const val VOID_DEEP = 0xFF0D0F14.toInt()
        private const val VOID_MID = 0xFF14171F.toInt()
        private const val VOID_RIM = 0xFF1C2030.toInt()
        private const val VOID_GHOST = 0xFF2A2E3E.toInt()
        private const val TEXT_PRIMARY = 0xFFF0F2F7.toInt()
        private const val TEXT_SECONDARY = 0xFF8A90A8.toInt()
        private const val TEXT_MUTED = 0xFF4A5068.toInt()
        private const val ACCENT_AMBER = 0xFFE8A040.toInt()
        private const val ACCENT_AMBER_DIM = 0xFFA86820.toInt()
        private const val STATUS_ON = 0xFF3DDC84.toInt()
        private const val DANGER = 0xFFE85540.toInt()
    }

    private var windowManager: WindowManager? = null
    private var bubbleView: View? = null
    private var miniPanelView: View? = null
    private var bubbleParams: WindowManager.LayoutParams? = null
    private var miniPanelParams: WindowManager.LayoutParams? = null

    // Track attachment state to prevent double-add / double-remove crashes
    private var isBubbleAttached = false
    private var isMiniPanelAttached = false

    private var isDragging = false
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var touchStartTime = 0L

    private val mainHandler = Handler(Looper.getMainLooper())
    private val autoHideHandler = Handler(Looper.getMainLooper())
    private val AUTO_HIDE_DELAY = 5000L

    private val prefs: SharedPreferences by lazy {
        getSharedPreferences("nightshade_bubble", MODE_PRIVATE)
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // ⚠️ CRITICAL: startForeground() must be called within 5 seconds of
        // onStartCommand(), or Android issues an ANR and kills the process.
        // Call it FIRST before doing anything else.
        startForeground(NOTIF_ID, buildServiceNotification())

        when (intent?.action) {
            ACTION_SHOW -> {
                prefs.edit().putBoolean("bubble_enabled", true).apply()
                // Defer view creation to avoid blocking onStartCommand
                mainHandler.postDelayed({ createBubble() }, 100)
            }
            ACTION_HIDE -> {
                prefs.edit().putBoolean("bubble_enabled", false).apply()
                destroyBubble()
                stopSelf()
            }
            ACTION_STOP -> {
                destroyBubble()
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        destroyBubble()
        isRunning = false
    }

    /**
     * ⚠️ Do NOT auto-restart on task removal — this causes the crash loop.
     * The ANR cascade: restart → addView blocks main thread → ANR → kill → restart → repeat.
     * Let the user explicitly re-enable from the app instead.
     */
    override fun onTaskRemoved(rootIntent: Intent?) {
        destroyBubble()
        stopSelf()
        super.onTaskRemoved(rootIntent)
    }

    // ─── Safe WindowManager Helpers ──────────────────────────────

    private fun safeAddView(view: View, params: WindowManager.LayoutParams): Boolean {
        return try {
            windowManager?.addView(view, params)
            true
        } catch (e: Exception) {
            Log.e("FloatingBubble", "addView failed: ${e.message}", e)
            false
        }
    }

    private fun safeRemoveView(view: View?) {
        if (view == null) return
        try {
            windowManager?.removeView(view)
        } catch (e: Exception) {
            Log.e("FloatingBubble", "removeView: ${e.message}")
        }
    }

    private fun safeUpdateLayout(view: View?, params: WindowManager.LayoutParams?) {
        if (view == null || params == null) return
        try {
            windowManager?.updateViewLayout(view, params)
        } catch (_: Exception) {}
    }

    // ─── Bubble Creation (deferred) ─────────────────────────────

    @SuppressLint("ClickableViewAccessibility")
    private fun createBubble() {
        if (isBubbleAttached && bubbleView != null) return

        if (!Settings.canDrawOverlays(this)) {
            broadcastPermissionMissing()
            stopSelf()
            return
        }

        isRunning = true

        // G1: Use the Iris Filter bubble icon
        bubbleView = ImageView(this).apply {
            setImageResource(R.drawable.ic_bubble_nightshade)
            setPadding(4, 4, 4, 4)
            elevation = 8f
        }

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_SYSTEM_ALERT
        }

        val savedX = prefs.getInt("bubble_x", 50)
        val savedY = prefs.getInt("bubble_y", 200)

        bubbleParams = WindowManager.LayoutParams(
            56, 56,  // Fixed size for bubble
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = savedX
            y = savedY
        }

        isBubbleAttached = safeAddView(bubbleView!!, bubbleParams!!)
        if (!isBubbleAttached) {
            isRunning = false
            bubbleView = null
            bubbleParams = null
            stopSelf()
            return
        }

        // Touch handling
        bubbleView?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = bubbleParams?.x ?: 0
                    initialY = bubbleParams?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    touchStartTime = System.currentTimeMillis()
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - initialTouchX
                    val dy = event.rawY - initialTouchY
                    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                        isDragging = true
                    }
                    if (isDragging) {
                        bubbleParams?.x = initialX + dx.toInt()
                        bubbleParams?.y = initialY + dy.toInt()
                        safeUpdateLayout(bubbleView, bubbleParams)
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    bubbleParams?.let { p ->
                        prefs.edit()
                            .putInt("bubble_x", p.x)
                            .putInt("bubble_y", p.y)
                            .apply()
                    }
                    if (!isDragging) {
                        val elapsed = System.currentTimeMillis() - touchStartTime
                        when {
                            elapsed > 500 -> openApp()
                            else -> {
                                showMiniPanel()
                                resetAutoHide()
                            }
                        }
                    }
                    true
                }
            }
            false
        }
    }

    private fun destroyBubble() {
        mainHandler.post {
            safeRemoveMiniPanel()
            safeRemoveBubble()
            isRunning = false
        }
    }

    private fun safeRemoveBubble() {
        if (!isBubbleAttached) return
        safeRemoveView(bubbleView)
        bubbleView = null
        bubbleParams = null
        isBubbleAttached = false
    }

    // ─── Mini Control Panel (G2: Void Architecture styling) ─────

    @SuppressLint("ClickableViewAccessibility")
    private fun showMiniPanel() {
        if (isMiniPanelAttached && miniPanelView != null) {
            safeRemoveMiniPanel()
            return
        }

        val currentPct = Math.round(OverlayService.currentOpacity * 100)

        miniPanelView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 20, 24, 20)
            // G2: Void-deep background, void-rim border — no glassmorphism
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                setColor(VOID_DEEP)           // #0D0F14 — void-deep
                cornerRadius = 16f
                setStroke(1, VOID_RIM)        // #1C2030 — void-rim
            }
            elevation = 16f

            // Header row: Toggle label + Open App
            val header = LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL

                val toggleBtn = TextView(context).apply {
                    // G2: No emoji, honest copy per spec
                    text = if (OverlayService.currentEnabled) "FILTER ON" else "FILTER OFF"
                    textSize = 14f
                    setTextColor(if (OverlayService.currentEnabled) STATUS_ON else TEXT_MUTED)
                    setPadding(0, 8, 16, 8)
                    setOnClickListener {
                        toggleFilter()
                        text = if (OverlayService.currentEnabled) "FILTER ON" else "FILTER OFF"
                        setTextColor(if (OverlayService.currentEnabled) STATUS_ON else TEXT_MUTED)
                        resetAutoHide()
                    }
                }
                addView(toggleBtn)

                // Spacer
                addView(View(context).apply {
                    layoutParams = LinearLayout.LayoutParams(0, 0, 1f)
                })

                val openBtn = TextView(context).apply {
                    text = "OPEN"
                    textSize = 12f
                    setTextColor(ACCENT_AMBER)
                    setPadding(12, 6, 12, 6)
                    background = GradientDrawable().apply {
                        shape = GradientDrawable.RECTANGLE
                        setColor(VOID_MID)
                        cornerRadius = 12f
                        setStroke(1, VOID_RIM)
                    }
                    setOnClickListener {
                        openApp()
                        safeRemoveMiniPanel()
                    }
                }
                addView(openBtn)
            }
            addView(header)

            // Separator
            addView(View(context).apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 1
                )
                setBackgroundColor(VOID_RIM)
                setPadding(0, 8, 0, 8)
            })

            // Dim level label
            val brightnessLabel = TextView(context).apply {
                text = "$currentPct%"
                textSize = 28f
                setTextColor(TEXT_PRIMARY)     // #F0F2F7
                setPadding(0, 4, 0, 2)
            }
            addView(brightnessLabel)

            val dimLabel = TextView(context).apply {
                text = "DIM LEVEL"
                textSize = 10f
                setTextColor(TEXT_MUTED)       // #4A5068
                setPadding(0, 0, 0, 8)
            }
            addView(dimLabel)

            // SeekBar
            val seekBar = SeekBar(context).apply {
                max = 180  // MAX_SAFE_OPACITY * 100 = 180%
                progress = currentPct.coerceAtMost(180)
                setPadding(0, 4, 0, 8)
                setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                    override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                        if (fromUser) {
                            brightnessLabel.text = "$progress%"
                            val newOpacity = progress / 100f
                            sendBrightnessToOverlay(newOpacity)
                        }
                    }
                    override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                    override fun onStopTrackingTouch(seekBar: SeekBar?) {
                        resetAutoHide()
                    }
                })
            }
            addView(seekBar)

            // Quick presets row — Void-styled pills
            val presetsRow = LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_HORIZONTAL
                val presets = listOf("25%" to 25, "50%" to 50, "100%" to 100, "180%" to 180)
                presets.forEach { (label, pct) ->
                    addView(TextView(context).apply {
                        text = label
                        textSize = 11f
                        setTextColor(TEXT_SECONDARY)
                        setPadding(10, 6, 10, 6)
                        background = GradientDrawable().apply {
                            shape = GradientDrawable.RECTANGLE
                            setColor(VOID_MID)      // #14171F — void-mid
                            cornerRadius = 8f
                            setStroke(1, VOID_RIM)  // #1C2030
                        }
                        setOnClickListener {
                            seekBar.progress = pct
                            brightnessLabel.text = "$pct%"
                            sendBrightnessToOverlay(pct / 100f)
                            resetAutoHide()
                        }
                    })
                }
            }
            addView(presetsRow)
        }

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_SYSTEM_ALERT
        }

        miniPanelParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = (bubbleParams?.x ?: 50) + 70
            y = bubbleParams?.y ?: 200
        }

        isMiniPanelAttached = safeAddView(miniPanelView!!, miniPanelParams!!)
        if (!isMiniPanelAttached) {
            miniPanelView = null
            miniPanelParams = null
        }
    }

    private fun safeRemoveMiniPanel() {
        if (!isMiniPanelAttached) return
        safeRemoveView(miniPanelView)
        miniPanelView = null
        miniPanelParams = null
        isMiniPanelAttached = false
    }

    // ─── Actions ─────────────────────────────────────────────────

    private fun toggleFilter() {
        val intent = Intent(this, OverlayService::class.java).apply {
            action = OverlayService.ACTION_TOGGLE
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        } catch (_: Exception) {}
    }

    private fun sendBrightnessToOverlay(opacity: Float) {
        val intent = Intent(this, OverlayService::class.java).apply {
            action = OverlayService.ACTION_SET_BRIGHTNESS
            putExtra(OverlayService.EXTRA_OPACITY, opacity)
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        } catch (_: Exception) {}
    }

    private fun openApp() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(intent)
    }

    private fun resetAutoHide() {
        autoHideHandler.removeCallbacksAndMessages(null)
        autoHideHandler.postDelayed({ safeRemoveMiniPanel() }, AUTO_HIDE_DELAY)
    }

    // ─── Foreground Service Notification ─────────────────────────

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
            .setSmallIcon(R.drawable.ic_bubble_nightshade)
            .setContentTitle("Floating Controls Active")
            .setContentText("Tap to dismiss")
            .setContentIntent(stopPi)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun broadcastPermissionMissing() {
        sendBroadcast(Intent("app.nightshade.screenfilter.ACTION_OVERLAY_PERMISSION_MISSING"))
    }
}
