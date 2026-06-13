package com.screenfilterapp

import android.os.Bundle
import android.view.View
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "ScreenFilterApp"

  override fun onCreate(savedInstanceState: android.os.Bundle?) {
    // Install the splash screen before super.onCreate
    val splashScreen = installSplashScreen()
    splashScreen.setKeepOnScreenCondition { false }
    super.onCreate(savedInstanceState)

    // Edge-to-edge display for Android 15+ compatibility
    // Prevents "not optimized" warnings by properly handling system bars
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
      window.setDecorFitsSystemWindows(false)
    }
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
