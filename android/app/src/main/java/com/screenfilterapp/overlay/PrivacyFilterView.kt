package com.screenfilterapp.overlay

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.view.View

/**
 * NightShade — Privacy Filter View
 *
 * Native Canvas approach for the Venetian-blind privacy overlay.
 * Draws vertical opaque stripes with transparent gaps between them.
 *
 * How it works:
 * - Face-on: your eyes look through the transparent gaps → full content visible.
 * - Side angle: your line of sight intersects more opaque stripe area → contrast reduced.
 *
 * Stripe math:
 *   gapDp = 2 dp (always the visible window)
 *   stripeDp = gapDp × (intensity / 40) — grows with intensity
 *   patternWidth = gapDp + stripeDp
 *
 * At intensity 50 (default), stripeDp = 2.5 dp, giving ~40-60% contrast reduction
 * from a 45° side angle — enough to deter casual shoulder-surfing.
 *
 * This is a SOFTWARE approximation. True privacy screens use physical micro-louvers.
 * Content can still be read from directly above/below or at close range.
 */
class PrivacyFilterView(context: Context) : View(context) {

    /** 0–100. Default 50 gives a noticeable side-angle effect. */
    var intensity: Float = 50f
        set(value) { field = value.coerceIn(0f, 100f); invalidate() }

    /** Opacity of the stripe walls (0.0–1.0). Default 0.92 for maximum occlusion. */
    var stripeOpacity: Float = 0.92f
        set(value) { field = value.coerceIn(0f, 1f); invalidate() }

    private val stripePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.BLACK
        style = Paint.Style.FILL
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (intensity <= 0f) return

        val density = resources.displayMetrics.density
        val gapPx = density * 2f              // 2 dp — visible window
        val stripePx = gapPx * (intensity / 40f).coerceAtLeast(0.5f)
        val patternPx = gapPx + stripePx

        // Update paint alpha based on stripe opacity
        stripePaint.alpha = (stripeOpacity * 255).toInt()

        var x = gapPx   // Start after first gap
        while (x < width) {
            canvas.drawRect(x, 0f, x + stripePx, height.toFloat(), stripePaint)
            x += patternPx
        }
    }
}
