# ============================================================
# NightShade ProGuard Rules
# Optimized for React Native + custom native modules
# Based on: React Native Production Readiness Guide
# ============================================================

# ─── React Native Core ───────────────────────────────────────
# Most of this is included automatically via the RN Gradle
# plugin's default rules on current versions; kept here to
# document intent and cover older RN versions.
-keep,allowobfuscation,allowoptimization class com.facebook.react.** { *; }
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}
-keepclassmembers class * {
    native <methods>;
}

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
-keep class app.nightshade.screenfilter.overlay.OverlayModule { *; }
-keep class app.nightshade.screenfilter.overlay.OverlayPackage { *; }
-keep class app.nightshade.screenfilter.overlay.OverlayService { *; }
-keep class app.nightshade.screenfilter.overlay.FloatingBubbleService { *; }
-keep class app.nightshade.screenfilter.overlay.PrivacyOverlayService { *; }
-keep class app.nightshade.screenfilter.overlay.PrivacyFilterView { *; }
-keep class app.nightshade.screenfilter.receiver.BootReceiver { *; }
-keep class app.nightshade.screenfilter.tile.FilterTileService { *; }
-keep class app.nightshade.screenfilter.ThemeModule { *; }
-keep class app.nightshade.screenfilter.ThemePackage { *; }
-keep class app.nightshade.screenfilter.MainActivity { *; }
-keep class app.nightshade.screenfilter.MainApplication { *; }

# Keep @ReactMethod annotated methods
-keepclassmembers class app.nightshade.screenfilter.** {
    @com.facebook.react.bridge.ReactMethod *;
}

# ─── Hermes Engine ───────────────────────────────────────────
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# ─── OkHttp / Retrofit ──────────────────────────────────────
# Retained for React Native internal networking
-dontwarn okhttp3.**
-dontwarn okio.**

# ─── Gson ────────────────────────────────────────────────────
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ─── Firebase / Crashlytics ──────────────────────────────────
# REMOVED — Firebase not used in this app
# -keepattributes SourceFile,LineNumberTable
# -keep public class * extends java.lang.Exception

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
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*

# ─── Warnings Suppression ────────────────────────────────────
-dontwarn java.lang.invoke.StringConcatFactory
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
