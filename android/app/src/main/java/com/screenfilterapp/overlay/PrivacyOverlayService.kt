package com.screenfilterapp.overlay

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.view.View
import android.view.WindowManager

/**
 * NightShade V5 — Privacy Overlay Service
 *
 * Uses PrivacyFilterView (native Canvas Venetian-blind pattern) instead of
 * the old BitmapShader approach. The new implementation provides a genuine
 * angular privacy effect:
 *
 * - Face-on: transparent gaps between vertical stripes let content through.
 * - Side angle: more opaque stripe area is visible → contrast reduced.
 *
 * This is a plain class (not an Android Service) that creates a WindowManager
 * overlay. It's instantiated by OverlayModule when the user enables the
 * privacy filter from the Settings screen.
 *
 * Density modes now map to intensity levels for the Venetian-blind pattern:
 *   SUBTLE   → intensity 30 (thin stripes, mild side-angle dimming)
 *   STANDARD → intensity 50 (balanced, good shoulder-surfing deterrence)
 *   STRONG   → intensity 80 (thick stripes, strong side-angle effect)
 *
 * Stripe opacity is controlled by the wallOpacity parameter (0.40–0.90).
 */
class PrivacyOverlayService(private val context: Context) {

    private var overlayView: View? = null
    private var privacyFilterView: PrivacyFilterView? = null
    private var windowManager: WindowManager? = null
    private var isActive = false
    private var density: PrivacyDensity = PrivacyDensity.STANDARD
    private var louverOpacity: Float = 0.75f

    enum class PrivacyDensity(val intensity: Float) {
        SUBTLE(30f),
        STANDARD(50f),
        STRONG(80f)
    }

    fun start(densityMode: PrivacyDensity = PrivacyDensity.STANDARD, opacity: Float = 0.75f) {
        if (isActive) stop()
        this.density = densityMode
        this.louverOpacity = opacity.coerceIn(0.40f, 0.90f)
        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val flags = (WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type, flags, PixelFormat.TRANSLUCENT
        ).apply {
            // Extend into notch region for full coverage
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }

        // Use PrivacyFilterView (native Canvas Venetian-blind pattern)
        privacyFilterView = PrivacyFilterView(context).apply {
            intensity = densityMode.intensity
            stripeOpacity = louverOpacity
        }
        overlayView = privacyFilterView
        windowManager?.addView(overlayView, params)
        isActive = true
    }

    fun stop() {
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (_: Exception) {
                // View may already be removed
            }
        }
        overlayView = null
        privacyFilterView = null
        isActive = false
    }

    fun isRunning() = isActive

    fun updateDensity(newDensity: PrivacyDensity) {
        if (isActive) {
            // Update the PrivacyFilterView intensity in-place if possible
            privacyFilterView?.intensity = newDensity.intensity
            this.density = newDensity
        } else {
            this.density = newDensity
        }
    }

    fun updateOpacity(opacity: Float) {
        louverOpacity = opacity.coerceIn(0.40f, 0.90f)
        if (isActive) {
            privacyFilterView?.stripeOpacity = louverOpacity
        }
    }
}
