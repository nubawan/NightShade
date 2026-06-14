package com.screenfilterapp.tile

import android.content.Intent
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import com.screenfilterapp.overlay.OverlayService

/**
 * Quick Settings Tile for Android 7.0+.
 * Allows users to toggle the screen filter directly from
 * the quick settings panel without opening the app.
 *
 * Usage: Swipe down → Tap NightShade tile → Toggle filter
 */
class FilterTileService : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        updateTile()
    }

    override fun onClick() {
        super.onClick()

        val intent = Intent(this, OverlayService::class.java).apply {
            action = OverlayService.ACTION_TOGGLE
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }

        // Brief delay then update tile state
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            updateTile()
        }, 300)
    }

    private fun updateTile() {
        qsTile?.apply {
            state = if (OverlayService.isRunning && OverlayService.currentEnabled) {
                Tile.STATE_ACTIVE
            } else {
                Tile.STATE_INACTIVE
            }
            label = "NightShade"
            contentDescription = "Toggle screen filter"
            updateTile()
        }
    }
}
