# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }

# Expo Video
-keep class expo.modules.video.** { *; }
-keep class expo.modules.kotlin.** { *; }

# Keep native crash reporting
-keepattributes SourceFile,LineNumberTable

# Keep generic signature of Call, Response (R8 full mode strips signatures from non-kept items).
-keep,allowshrinking,allowoptimization interface retrofit2.Call
-keep,allowshrinking,allowoptimization class retrofit2.Response

# With R8 full mode generic signatures are stripped for classes that are not
# kept. Suspend functions are wrapped in continuations where the type argument
# is used.
-keep,allowshrinking,allowoptimization class kotlin.coroutines.Continuation

# Keep all native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep crash reporting
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions

# Fresco (for image loading)
-keep,allowshrinking @com.facebook.common.internal.DoNotStrip class *
-keep,allowshrinking @interface com.facebook.common.internal.DoNotStrip
-keep,allowshrinking class * {
    @com.facebook.common.internal.DoNotStrip *;
}

# ExoPlayer (used by expo-video)
-keep class com.google.android.exoplayer2.** { *; }
-dontwarn com.google.android.exoplayer2.**