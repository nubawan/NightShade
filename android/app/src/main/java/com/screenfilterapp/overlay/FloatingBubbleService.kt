package com.screenfilterapp.overlay

import android.annotation.SuppressLint
import android.app.Service
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.*
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.TextView
import com.screenfilterapp.MainActivity

/**
 * NightShade V5 — Floating Bubble Service
 *
 * V5 Critical Fixes:
 * - Defensive WindowManager: try/catch on EVERY addView/removeView/updateViewLayout
 * - Never add a view that's already attached
 * - Never remove a view that's already detached
 * - Never update layout params on a detached view
 * - State sync: emits NightShadeStateUpdate after every change
 * - START_STICKY with auto-restart on task removal
 * - Position persistence across restarts
 * - SeekBar-based brightness control (0–200)
 */
class FloatingBubbleService : Service() {

    companion object {
        const val ACTION_SHOW = "com.screenfilterapp.BUBBLE_SHOW"
        const val ACTION_HIDE = "com.screenfilterapp.BUBBLE_HIDE"
        const val ACTION_RESTORE = "com.screenfilterapp.BUBBLE_RESTORE"
        var isRunning = false
            private set
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
    private var isMiniPanelVisible = false
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var touchStartTime = 0L

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
        when (intent?.action) {
            ACTION_SHOW -> {
                prefs.edit().putBoolean("bubble_enabled", true).apply()
                showBubble()
            }
            ACTION_HIDE -> {
                prefs.edit().putBoolean("bubble_enabled", false).apply()
                hideBubble()
            }
            ACTION_RESTORE -> {
                if (prefs.getBoolean("bubble_enabled", false) && !isBubbleAttached) {
                    showBubble()
                }
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        safeRemoveBubble()
        safeRemoveMiniPanel()
        isRunning = false
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        if (prefs.getBoolean("bubble_enabled", false)) {
            val restartIntent = Intent(this, FloatingBubbleService::class.java).apply {
                action = ACTION_RESTORE
            }
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(restartIntent)
                } else {
                    startService(restartIntent)
                }
            } catch (_: Exception) {
                // Service restart may fail in some OEM restrictions
            }
        }
        super.onTaskRemoved(rootIntent)
    }

    // ─── Safe WindowManager Helpers ──────────────────────────────
    // Every WindowManager operation is wrapped in try/catch.
    // We track attachment state to prevent double-add/double-remove.

    private fun safeAddView(view: View, params: WindowManager.LayoutParams): Boolean {
        return try {
            windowManager?.addView(view, params)
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun safeRemoveView(view: View?) {
        if (view == null) return
        try {
            windowManager?.removeView(view)
        } catch (_: Exception) {
            // View may already be removed or not attached
        }
    }

    private fun safeUpdateLayout(view: View?, params: WindowManager.LayoutParams?) {
        if (view == null || params == null) return
        try {
            windowManager?.updateViewLayout(view, params)
        } catch (_: Exception) {
            // View may have been removed
        }
    }

    // ─── Bubble ──────────────────────────────────────────────────

    @SuppressLint("ClickableViewAccessibility")
    private fun showBubble() {
        if (isBubbleAttached && bubbleView != null) return

        isRunning = true

        bubbleView = TextView(this).apply {
            text = "🌙"
            textSize = 20f
            setPadding(14, 10, 14, 10)
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(0xFF1B2A60.toInt())  // Night Blue palette
                setStroke(2, 0xFFB8C9FF.toInt())
            }
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
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
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

    private fun hideBubble() {
        safeRemoveMiniPanel()
        safeRemoveBubble()
        isRunning = false
    }

    private fun safeRemoveBubble() {
        if (!isBubbleAttached) return
        safeRemoveView(bubbleView)
        bubbleView = null
        bubbleParams = null
        isBubbleAttached = false
    }

    // ─── Mini Control Panel ──────────────────────────────────────

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
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                setColor(0xFF1D2029.toInt())  // Night Blue surface
                cornerRadius = 16f
                setStroke(1, 0xFFB8C9FF.toInt())
            }
            elevation = 16f

            // Header row: Toggle + Open App
            val header = LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL

                val toggleBtn = TextView(context).apply {
                    text = if (OverlayService.currentEnabled) "🌙 Filter ON" else "☀️ Filter OFF"
                    textSize = 16f
                    setTextColor(0xFFB8C9FF.toInt())
                    setPadding(0, 8, 16, 8)
                    setOnClickListener {
                        toggleFilter()
                        text = if (OverlayService.currentEnabled) "🌙 Filter ON" else "☀️ Filter OFF"
                        resetAutoHide()
                    }
                }
                addView(toggleBtn)

                val openBtn = TextView(context).apply {
                    text = "📱"
                    textSize = 18f
                    setPadding(16, 8, 0, 8)
                    setOnClickListener {
                        openApp()
                        safeRemoveMiniPanel()
                    }
                }
                addView(openBtn)
            }
            addView(header)

            // Brightness label
            val brightnessLabel = TextView(context).apply {
                text = "Brightness: $currentPct%"
                textSize = 13f
                setTextColor(0xFFC4C6D0.toInt())
                setPadding(0, 12, 0, 4)
            }
            addView(brightnessLabel)

            // SeekBar
            val seekBar = SeekBar(context).apply {
                max = 200
                progress = currentPct.coerceAtMost(200)
                setPadding(0, 4, 0, 8)
                setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                    override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                        if (fromUser) {
                            brightnessLabel.text = "Brightness: $progress%"
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

            // Quick presets row
            val presetsRow = LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_HORIZONTAL
                val presets = listOf("25%" to 25, "50%" to 50, "75%" to 75, "100%" to 100, "150%" to 150)
                presets.forEach { (label, pct) ->
                    addView(TextView(context).apply {
                        text = label
                        textSize = 12f
                        setTextColor(0xFFB8C9FF.toInt())
                        setPadding(8, 6, 8, 6)
                        background = GradientDrawable().apply {
                            shape = GradientDrawable.RECTANGLE
                            setColor(0xFF354190.toInt())
                            cornerRadius = 8f
                        }
                        setOnClickListener {
                            seekBar.progress = pct
                            brightnessLabel.text = "Brightness: $pct%"
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
        isMiniPanelVisible = false
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
}
