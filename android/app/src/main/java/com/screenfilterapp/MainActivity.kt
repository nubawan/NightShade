package com.screenfilterapp

import android.content.Context
import android.os.Build
import android.view.View
import android.graphics.Color
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "ScreenFilterApp"

  override fun onCreate(savedInstanceState: android.os.Bundle?) {
    // ⚠️ MUST be before super.onCreate() — theme is resolved here.
    // If this runs after super.onCreate(), the activity has already measured
    // itself in the old theme and the switch will not take effect until
    // the next activity recreation.
    val prefs = getSharedPreferences("app_theme", Context.MODE_PRIVATE)
    val savedMode = prefs.getInt("night_mode", AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
    AppCompatDelegate.setDefaultNightMode(savedMode)

    // Install the splash screen before super.onCreate
    val splashScreen = installSplashScreen()
    splashScreen.setKeepOnScreenCondition { false }
    super.onCreate(savedInstanceState)

    // Edge-to-edge display for Android 15+ compatibility
    // Prevents "not optimized" warnings by properly handling system bars
    WindowCompat.setDecorFitsSystemWindows(window, false)

    // Make nav bar transparent so our content can draw behind it
    // window.navigationBarColor is deprecated on API 35+ but still needed
    // for older devices. Suppress the deprecation warning.
    @Suppress("DEPRECATION")
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      window.navigationBarColor = Color.TRANSPARENT
    }
    // API 29+ — fully transparent + light/dark icon control
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      @Suppress("DEPRECATION")
      window.isNavigationBarContrastEnforced = false
    }
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
