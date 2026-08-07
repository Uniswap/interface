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
  // e2e/CI builds enable Datadog so every scheduled Maestro run behaves as a synthetic perf probe,
  // emitting the same RUM vitals as prod. Build-gated on isE2eTestEnv (baked from IS_E2E_TEST, only
  // set by the e2e build actions), so this can never turn on in dev/beta/prod/release builds.
  // Isolation from the prod RUM app (env + source tags, optional dedicated app) is handled in
  // DatadogProviderWrapper's initializeDatadog. Mobile is the sole consumer of this native module.
  if (isE2eTestEnv()) {
    return true
  }
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  return (localDevDatadogEnabled || !isRNDev()) && !isUnitTestEnv()
}
