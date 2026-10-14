# Project-specific R8 keep rules, appended to proguard-android-optimize.txt and library consumer rules.

# Gson (de)serializes seed-phrase backups by field name; renaming orphans every existing Drive backup.
-keep class com.uniswap.CloudStorageMnemonicBackup { *; }

# google-http-client maps JSON through @Key fields and reflective no-arg constructors, and ships no rules.
-keepattributes Signature,RuntimeVisibleAnnotations,AnnotationDefault
-keepclassmembers class * {
  @com.google.api.client.util.Key <fields>;
}
-keepclassmembers class * extends com.google.api.client.util.GenericData {
  <init>();
}
-keep class com.google.api.services.drive.** { *; }

# uniffi bindings (Yttrium via @walletconnect/react-native-compat) bind native symbols and Structure fields by name through JNA.
-keep class com.sun.jna.** { *; }
-keep class uniffi.** { *; }
-dontwarn java.awt.**
