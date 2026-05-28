import { getConfig, NodeEnv } from '@universe/config'
import DeviceInfo from 'react-native-device-info'

export const BUNDLE_ID = DeviceInfo.getBundleId()

export function isTestEnv(): boolean {
  return isUnitTestEnv() || getConfig().nodeEnv === NodeEnv.Test || isE2eTestEnv()
}

export function isUnitTestEnv(): boolean {
  return getConfig().isUnitTest
}

export function isE2eTestEnv(): boolean {
  return getConfig().isE2ETest
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

export const localDevDatadogEnabled = false

export function isDatadogEnabled(): boolean {
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  return (localDevDatadogEnabled || !isRNDev()) && !isUnitTestEnv() && !isE2eTestEnv()
}
