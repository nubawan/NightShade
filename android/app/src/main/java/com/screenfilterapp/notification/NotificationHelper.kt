package com.screenfilterapp.notification

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.screenfilterapp.MainActivity
import com.screenfilterapp.R
import com.screenfilterapp.overlay.OverlayService

/**
 * Helper class for managing the persistent notification for the overlay service.
 * The notification provides quick controls: Pause, Resume, and Open App.
 */
object NotificationHelper {

    const val CHANNEL_ID = "screen_filter_channel"
    const val NOTIFICATION_ID = 1001

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Filter",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Screen filter overlay is active"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun buildNotification(
        context: Context,
        isActive: Boolean,
        isPaused: Boolean
    ): Notification {
        val openAppIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openAppPendingIntent = PendingIntent.getActivity(
            context, 0, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val toggleIntent = Intent(context, OverlayService::class.java).apply {
            action = OverlayService.ACTION_TOGGLE
        }
        val togglePendingIntent = PendingIntent.getService(
            context, 1, toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val pauseResumeIntent = Intent(context, OverlayService::class.java).apply {
            action = if (isPaused) OverlayService.ACTION_RESUME else OverlayService.ACTION_PAUSE
        }
        val pauseResumePendingIntent = PendingIntent.getService(
            context, 2, pauseResumeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val statusText = when {
            !isActive -> "Inactive"
            isPaused -> "Paused"
            else -> "Active"
        }

        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle("Screen Filter")
            .setContentText("Filter $statusText")
            .setSmallIcon(android.R.drawable.ic_menu_view)
            .setContentIntent(openAppPendingIntent)
            .addAction(
                android.R.drawable.ic_media_pause,
                if (isPaused) "Resume" else "Pause",
                pauseResumePendingIntent
            )
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Toggle",
                togglePendingIntent
            )
            .setOngoing(true)
            .setSilent(true)
            .build()
    }
}
