package com.screenfilterapp.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.screenfilterapp.overlay.OverlayService
import com.screenfilterapp.overlay.FloatingBubbleService

/**
 * NightShade V4 — Boot Receiver
 * Restores overlay and floating bubble after device restart.
 * Also restores bubble state on app process restart.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
            intent.action != "android.intent.action.QUICKBOOT_POWERON" &&
            intent.action != "com.htc.intent.action.QUICKBOOT_POWERON"
        ) {
            return
        }

        Log.d(TAG, "Boot completed received, checking auto-start settings")

        val prefs = context.getSharedPreferences("nightshade_prefs", Context.MODE_PRIVATE)
        val autoStart = prefs.getBoolean("auto_start_enabled", false)
        val wasEnabled = prefs.getBoolean("was_overlay_enabled", false)

        // Restore overlay filter
        if (autoStart && wasEnabled) {
            val opacity = prefs.getFloat("last_opacity", 0.3f)
            val color = prefs.getString("last_color", "#FF000000") ?: "#FF000000"

            Log.d(TAG, "Restoring overlay: opacity=$opacity, color=$color")

            val serviceIntent = Intent(context, OverlayService::class.java).apply {
                action = OverlayService.ACTION_ENABLE
                putExtra(OverlayService.EXTRA_OPACITY, opacity)
                putExtra(OverlayService.EXTRA_COLOR, color)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }

            // Also restore floating bubble if it was enabled
            val bubblePrefs = context.getSharedPreferences("nightshade_bubble", Context.MODE_PRIVATE)
            if (bubblePrefs.getBoolean("bubble_enabled", false)) {
                Log.d(TAG, "Restoring floating bubble")
                val bubbleIntent = Intent(context, FloatingBubbleService::class.java).apply {
                    action = FloatingBubbleService.ACTION_SHOW
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(bubbleIntent)
                } else {
                    context.startService(bubbleIntent)
                }
            }
        } else {
            Log.d(TAG, "Auto-start disabled or overlay was not enabled, skipping")
        }
    }
}
