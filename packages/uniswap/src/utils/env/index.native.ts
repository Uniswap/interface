import DeviceInfo from 'react-native-device-info'

const BUNDLE_ID = DeviceInfo.getBundleId()

export function isDevEnv(): boolean {
  return BUNDLE_ID.endsWith('.dev')
}

export function isBetaEnv(): boolean {
  return BUNDLE_ID.endsWith('.beta')
}

export function isProdEnv(): boolean {
  return BUNDLE_ID === 'com.uniswap.mobile'
}
