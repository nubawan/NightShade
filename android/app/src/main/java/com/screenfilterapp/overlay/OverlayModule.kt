package com.screenfilterapp.overlay

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * NightShade V5 — React Native Bridge Module
 *
 * Key V5 changes:
 * - Emits state updates to JS via DeviceEventManagerModule
 *   (so Dashboard, Bubble, Notification, Tile all stay synchronized)
 * - setOpacity with 0–2.0 range
 * - All state-changing methods call emitStateUpdate()
 */
class OverlayModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "OverlayModule"

    // ─── Privacy Filter ─────────────────────────────────────────

    private var privacyService: PrivacyOverlayService? = null

    // ─── State Emission ──────────────────────────────────────────

    /**
     * Send current overlay state to JS side.
     * Called after every state-changing operation.
     * JS OverlayStateStore subscribes to "NightShadeStateUpdate" events.
     */
    private fun emitStateUpdate() {
        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("NightShadeStateUpdate", Arguments.createMap().apply {
                    putBoolean("enabled", OverlayService.currentEnabled)
                    putDouble("opacity", OverlayService.currentOpacity.toDouble())
                    putString("color", String.format("#%08X", OverlayService.currentColor))
                    // presetId is managed on JS side
                })
        } catch (_: Exception) {
            // Context may be null if app is in background
        }
    }

    // ─── Overlay Control ─────────────────────────────────────────

    @ReactMethod
    fun enableOverlay(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                action = OverlayService.ACTION_ENABLE
            }
            startForegroundService(intent)
            emitStateUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", "Failed to enable overlay: ${e.message}")
        }
    }

    @ReactMethod
    fun disableOverlay(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                action = OverlayService.ACTION_DISABLE
            }
            reactApplicationContext.startService(intent)
            emitStateUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", "Failed to disable overlay: ${e.message}")
        }
    }

    @ReactMethod
    fun toggleOverlay(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                action = OverlayService.ACTION_TOGGLE
            }
            startForegroundService(intent)
            emitStateUpdate()
            promise.resolve(!OverlayService.currentEnabled)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", "Failed to toggle overlay: ${e.message}")
        }
    }

    @ReactMethod
    fun isOverlayEnabled(promise: Promise) {
        promise.resolve(OverlayService.isRunning && OverlayService.currentEnabled)
    }

    // ─── Overlay Properties (0.0–2.0 extended) ──────────────────

    @ReactMethod
    fun setOpacity(opacity: Double, promise: Promise) {
        try {
            val maxSafe = OverlayService.MAX_SAFE_OPACITY.toDouble()
            val clamped = opacity.coerceIn(0.0, maxSafe)
            val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                action = OverlayService.ACTION_SET_BRIGHTNESS
                putExtra(OverlayService.EXTRA_OPACITY, clamped.toFloat())
            }
            startForegroundService(intent)
            emitStateUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", "Failed to set opacity: ${e.message}")
        }
    }

    @ReactMethod
    fun setColor(color: String, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                action = OverlayService.ACTION_UPDATE
                putExtra(OverlayService.EXTRA_COLOR, color)
            }
            startForegroundService(intent)
            emitStateUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", "Failed to set color: ${e.message}")
        }
    }

    @ReactMethod
    fun updateOverlay(enabled: Boolean, opacity: Double, color: String, promise: Promise) {
        try {
            val maxSafe = OverlayService.MAX_SAFE_OPACITY.toDouble()
            if (enabled) {
                val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                    action = OverlayService.ACTION_ENABLE
                    putExtra(OverlayService.EXTRA_OPACITY, opacity.coerceIn(0.0, maxSafe).toFloat())
                    putExtra(OverlayService.EXTRA_COLOR, color)
                }
                startForegroundService(intent)
            } else {
                val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                    action = OverlayService.ACTION_DISABLE
                }
                reactApplicationContext.startService(intent)
            }
            emitStateUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", "Failed to update overlay: ${e.message}")
        }
    }

    // ─── Emergency Reset ─────────────────────────────────────────

    @ReactMethod
    fun emergencyReset(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                action = OverlayService.ACTION_EMERGENCY_RESET
            }
            startForegroundService(intent)
            emitStateUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", "Failed emergency reset: ${e.message}")
        }
    }

    // ─── Brightness Quick Adjust ─────────────────────────────────

    @ReactMethod
    fun brightnessUp(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                action = OverlayService.ACTION_BRIGHTNESS_UP
            }
            startForegroundService(intent)
            emitStateUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", "Failed: ${e.message}")
        }
    }

    @ReactMethod
    fun brightnessDown(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                action = OverlayService.ACTION_BRIGHTNESS_DOWN
            }
            startForegroundService(intent)
            emitStateUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", "Failed: ${e.message}")
        }
    }

    // ─── Permissions ─────────────────────────────────────────────

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}")
            ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", "Failed: ${e.message}")
        }
    }

    // ─── Service Control ─────────────────────────────────────────

    @ReactMethod
    fun startService(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java)
            startForegroundService(intent)
            emitStateUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed: ${e.message}")
        }
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            reactApplicationContext.stopService(Intent(reactApplicationContext, OverlayService::class.java))
            emitStateUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", "Failed: ${e.message}")
        }
    }

    // ─── Floating Bubble ─────────────────────────────────────────

    @ReactMethod
    fun showBubble(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FloatingBubbleService::class.java).apply {
                action = FloatingBubbleService.ACTION_SHOW
            }
            startForegroundService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("BUBBLE_ERROR", "Failed to show bubble: ${e.message}")
        }
    }

    @ReactMethod
    fun hideBubble(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FloatingBubbleService::class.java).apply {
                action = FloatingBubbleService.ACTION_HIDE
            }
            reactApplicationContext.startService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("BUBBLE_ERROR", "Failed to hide bubble: ${e.message}")
        }
    }

    @ReactMethod
    fun isBubbleVisible(promise: Promise) {
        promise.resolve(FloatingBubbleService.isRunning)
    }

    // ─── Quick Tile ──────────────────────────────────────────────

    @ReactMethod
    fun updateTileState(enabled: Boolean, promise: Promise) {
        try {
            val intent = Intent("com.screenfilterapp.TILE_UPDATE").apply {
                putExtra("enabled", enabled)
                setPackage(reactApplicationContext.packageName)
            }
            reactApplicationContext.sendBroadcast(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("TILE_ERROR", "Failed: ${e.message}")
        }
    }

    // ─── Battery Settings ────────────────────────────────────────

    @ReactMethod
    fun openBatterySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            try {
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:${reactApplicationContext.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(null)
            } catch (e2: Exception) {
                promise.reject("SETTINGS_ERROR", "Failed: ${e2.message}")
            }
        }
    }

    // ─── Privacy Filter Bridge ─────────────────────────────────────

    @ReactMethod
    fun startPrivacyFilter(densityMode: String, opacity: Double, promise: Promise) {
        try {
            if (privacyService == null) {
                privacyService = PrivacyOverlayService(reactApplicationContext)
            }
            val density = when (densityMode.lowercase()) {
                "subtle"   -> PrivacyOverlayService.PrivacyDensity.SUBTLE
                "strong"   -> PrivacyOverlayService.PrivacyDensity.STRONG
                else       -> PrivacyOverlayService.PrivacyDensity.STANDARD
            }
            privacyService?.start(density, opacity.toFloat())
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PRIVACY_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopPrivacyFilter(promise: Promise) {
        privacyService?.stop()
        promise.resolve(true)
    }

    @ReactMethod
    fun isPrivacyFilterActive(promise: Promise) {
        promise.resolve(privacyService?.isRunning() ?: false)
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private fun startForegroundService(intent: Intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(intent)
        } else {
            reactApplicationContext.startService(intent)
        }
    }
}
