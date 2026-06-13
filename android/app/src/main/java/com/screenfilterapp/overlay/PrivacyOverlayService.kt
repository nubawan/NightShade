package com.screenfilterapp.overlay

import android.content.Context
import android.graphics.*
import android.view.View
import android.view.WindowManager
import android.os.Build

class PrivacyOverlayService(private val context: Context) {

    private var overlayView: View? = null
    private var windowManager: WindowManager? = null
    private var isActive = false
    private var density: PrivacyDensity = PrivacyDensity.STANDARD
    private var louverOpacity: Float = 0.75f

    enum class PrivacyDensity(val gapPx: Int, val wallPx: Int) {
        SUBTLE(4, 1),
        STANDARD(2, 1),
        STRONG(1, 1)
    }

    private fun createLouverBitmap(density: PrivacyDensity): Bitmap {
        val pitch = density.gapPx + density.wallPx
        val bitmap = Bitmap.createBitmap(1, pitch, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
        val wallPaint = Paint().apply {
            color = Color.argb((louverOpacity * 255).toInt(), 0, 0, 0)
            isAntiAlias = false
        }
        for (i in density.gapPx until pitch) {
            canvas.drawRect(0f, i.toFloat(), 1f, (i + 1).toFloat(), wallPaint)
        }
        return bitmap
    }

    private fun createPrivacyView(): View {
        val bitmap = createLouverBitmap(density)
        val shader = BitmapShader(bitmap, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT)
        val paint = Paint().apply {
            this.shader = shader
            isAntiAlias = false
        }
        return object : View(context) {
            override fun onDraw(canvas: Canvas) {
                canvas.drawPaint(paint)
            }
        }.apply {
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
        }
    }

    fun start(densityMode: PrivacyDensity = PrivacyDensity.STANDARD, opacity: Float = 0.75f) {
        if (isActive) stop()
        this.density = densityMode
        this.louverOpacity = opacity.coerceIn(0.40f, 0.90f)
        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val flags = (WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN)
        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type, flags, PixelFormat.TRANSLUCENT
        )
        overlayView = createPrivacyView()
        windowManager?.addView(overlayView, params)
        isActive = true
    }

    fun stop() {
        overlayView?.let { windowManager?.removeViewImmediate(it) }
        overlayView = null
        isActive = false
    }

    fun isRunning() = isActive

    fun updateDensity(newDensity: PrivacyDensity) {
        if (isActive) { stop(); start(newDensity, louverOpacity) }
        else { this.density = newDensity }
    }
}
