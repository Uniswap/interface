import { ExpoConfig } from 'expo/config'

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
        },
        android: {
          newArchEnabled: true,
          predictiveBackGestureEnabled: false,
        },
      },
    ],
  ],
}

export default config
