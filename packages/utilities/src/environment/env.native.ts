import DeviceInfo from 'react-native-device-info'

export const BUNDLE_ID = DeviceInfo.getBundleId()

export function isPlaywrightEnv(): boolean {
  return false
}

export function isTestEnv(): boolean {
  return (
    !!process.env.JEST_WORKER_ID ||
    process.env.NODE_ENV === 'test' ||
    !!process.env.VITEST_POOL_ID ||
    process.env.IS_E2E_TEST?.toLowerCase() === 'true'
  )
}

export function isDevEnv(): boolean {
  return BUNDLE_ID.endsWith('.dev')
}

export function isBetaEnv(): boolean {
  return BUNDLE_ID.endsWith('.beta')
}

export function isProdEnv(): boolean {
  return BUNDLE_ID === 'com.uniswap.mobile'
}

export function isRNDev(): boolean {
  return __DEV__
}
