package com.screenfilterapp

import android.content.Context
import androidx.appcompat.app.AppCompatDelegate
import com.facebook.react.bridge.*
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.module.annotations.ReactModule

/**
 * NightShade — Theme Module
 *
 * React Native bridge module for switching the Android app theme.
 * Must be called on the UI thread because AppCompatDelegate.setDefaultNightMode()
 * triggers a configuration change that recreates the activity.
 *
 * The selected mode is persisted to SharedPreferences so that
 * MainActivity can restore it BEFORE super.onCreate() on cold start.
 */
@ReactModule(name = ThemeModule.NAME)
class ThemeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "ThemeModule"
        private const val PREFS_NAME = "app_theme"
        private const val KEY_NIGHT_MODE = "night_mode"
    }

    override fun getName(): String = NAME

    /**
     * Switch the app theme. Must run on the UI thread.
     *
     * @param mode  "dark" | "light" | "system"
     */
    @ReactMethod
    fun setTheme(mode: String, promise: Promise) {
        val nightMode = when (mode) {
            "dark"   -> AppCompatDelegate.MODE_NIGHT_YES
            "light"  -> AppCompatDelegate.MODE_NIGHT_NO
            else     -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
        }

        // Save before switching so MainActivity reads it on next cold start
        reactApplicationContext
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putInt(KEY_NIGHT_MODE, nightMode)
            .apply()

        // UI changes MUST run on the main thread
        UiThreadUtil.runOnUiThread {
            AppCompatDelegate.setDefaultNightMode(nightMode)
            promise.resolve(null)
        }
    }

    /**
     * Get the current theme mode.
     *
     * @return "dark" | "light" | "system"
     */
    @ReactMethod
    fun getCurrentTheme(promise: Promise) {
        val mode = when (AppCompatDelegate.getDefaultNightMode()) {
            AppCompatDelegate.MODE_NIGHT_YES -> "dark"
            AppCompatDelegate.MODE_NIGHT_NO  -> "light"
            else                             -> "system"
        }
        promise.resolve(mode)
    }
}
