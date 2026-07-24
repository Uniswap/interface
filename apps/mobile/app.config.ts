import type { ExpoConfig } from 'expo/config'

// Build-time Expo config runs in Node, before the app's getConfig() runtime exists, so process.env is correct here.
// oxlint-disable-next-line eslint-js/no-restricted-syntax -- build-time config; getConfig() is runtime-only
const useEasBuildCache = !process.env['EXPO_LOCAL_NO_BUILD_CACHE']

const config: ExpoConfig = {
  name: 'Uniswap',
  slug: 'uniswapmobile',
  scheme: 'uniswap',
  owner: 'uniswap',
  extra: {
    eas: {
      projectId: 'f1be3813-43d7-49ac-a792-7f42cf8500f5',
    },
  },
  experiments: {
    // EAS cache reinstalls a fingerprint-matched APK, embedding stale JS on JS-only release-variant changes. runAndroidLocal.sh disables it to force a real build.
    buildCacheProvider: useEasBuildCache ? 'eas' : undefined,
  },
  plugins: [
    [
      'expo-build-properties',
      {
        ios: {
          newArchEnabled: true,
          deploymentTarget: '16.4',
          // Temporary revert to source-built RN core: patches/react-native@0.85.3.patch carries a native
          // ReactCommon fix (INFRA-2390 yoga ghost views, facebook/react-native#52349) that prebuilt
          // XCFrameworks silently drop. Re-enable prebuilt core once the artifacts include the fix.
          // Mirrors ios/Podfile.properties.json (source of truth for pod install in this bare workflow).
          buildReactNativeFromSource: true,
        },
        android: {
          newArchEnabled: true,
          predictiveBackGestureEnabled: false,
          // Precompile shared RN core headers for autolinked codegen C++ (SDK 56 experimental).
          // Mirrors android/app/build.gradle + src/main/jni/ (source of truth in this bare workflow).
          usePrecompiledHeaders: true,
        },
      },
    ],
  ],
}

export default config
