# ============================================================
# NightShade ProGuard Rules
# Optimized for React Native + custom native modules
# ============================================================

# ─── React Native Core ───────────────────────────────────────
# Keep React Native bridge classes
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}
-keep @interface com.facebook.proguard.annotations.DoNotStrip

# Keep React Native modules, view managers, and packages
-keep class * extends com.facebook.react.bridge.ReactModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keep class * extends com.facebook.react.ReactPackage { *; }
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.turbomodule.core.interfaces.TurboModule { *; }

# React Native bridge — method calls from JS
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}
-keepclassmembers class com.facebook.react.bridge.JavaScriptModule {
    *;
}
-keepclassmembers class com.facebook.react.bridge.ReadOnlyNativeMap {
    *;
}

# ─── NightShade Native Modules ───────────────────────────────
# Keep all overlay module classes — they're accessed via React bridge
-keep class com.screenfilterapp.overlay.OverlayModule { *; }
-keep class com.screenfilterapp.overlay.OverlayPackage { *; }
-keep class com.screenfilterapp.overlay.OverlayService { *; }
-keep class com.screenfilterapp.overlay.FloatingBubbleService { *; }
-keep class com.screenfilterapp.overlay.PrivacyOverlayService { *; }
-keep class com.screenfilterapp.overlay.PrivacyFilterView { *; }
-keep class com.screenfilterapp.notification.NotificationHelper { *; }
-keep class com.screenfilterapp.receiver.BootReceiver { *; }
-keep class com.screenfilterapp.tile.FilterTileService { *; }
-keep class com.screenfilterapp.ThemeModule { *; }
-keep class com.screenfilterapp.ThemePackage { *; }
-keep class com.screenfilterapp.MainActivity { *; }
-keep class com.screenfilterapp.MainApplication { *; }

# Keep @ReactMethod annotated methods
-keepclassmembers class com.screenfilterapp.** {
    @com.facebook.react.bridge.ReactMethod *;
}

# ─── Hermes Engine ───────────────────────────────────────────
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }

# ─── AndroidX / Support Library ──────────────────────────────
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# ─── Kotlin ──────────────────────────────────────────────────
-dontwarn kotlin.**
-keep class kotlin.Metadata { *; }
-keepclassmembers class kotlin.Metadata {
    public *;
}

# ─── React Navigation ────────────────────────────────────────
-keep class com.reactnativecommunity.** { *; }
-keep class com.swmansion.** { *; }

# ─── Vector Icons ────────────────────────────────────────────
-keep class com.oblador.vectoricons.** { *; }

# ─── Async Storage ───────────────────────────────────────────
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ─── Android Services & Receivers ────────────────────────────
# Keep foreground service types and broadcast receivers
-keep class * extends android.app.Service { *; }
-keep class * extends android.content.BroadcastReceiver { *; }
-keep class * extends android.service.quicksettings.TileService { *; }

# ─── Remove Debug Logging ────────────────────────────────────
# Strip Log.d/Log.v/Log.i calls in release for performance & size
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# ─── Aggressive Optimization ─────────────────────────────────
# Optimization passes
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose

# Optimization settings
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*

# ─── Warnings Suppression ────────────────────────────────────
-dontwarn java.lang.invoke.StringConcatFactory
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
