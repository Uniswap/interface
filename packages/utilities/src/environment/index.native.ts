import DeviceInfo from 'react-native-device-info'

const BUNDLE_ID = DeviceInfo.getBundleId()

export function isTestEnv(): boolean {
  return !!process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test'
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

export function getEnvName(): 'production' | 'staging' | 'development' {
  if (isBetaEnv()) {
    return 'staging'
  }
  if (isProdEnv()) {
    return 'production'
  }
  return 'development'
}
