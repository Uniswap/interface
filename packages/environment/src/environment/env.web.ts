import { Environment, getConfig, NodeEnv } from '@universe/config'
import { getChromeRuntime } from '../chrome'
import { isExtensionApp, isWebApp } from '../platform'
import { TRUSTED_CHROME_EXTENSION_IDS } from './extensionId'

export const BUNDLE_ID = ''

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
  if (isExtensionApp) {
    const chromeRuntime = getChromeRuntime()

    if (!chromeRuntime) {
      // oxlint-disable-next-line no-console -- Console logging needed for debugging
      console.warn(
        'Avoid using `isDevEnv()` inside the injected script. Use `__DEV__` instead. ' +
          '`chrome.runtime` is only available when the injected script is running inside a trusted site (`app.uniswap.org`). ' +
          'This helper only works reliably when running the app locally but not when publishing the Dev build.',
      )
      return __DEV__
    }

    return (
      __DEV__ ||
      chromeRuntime.id === TRUSTED_CHROME_EXTENSION_IDS.dev ||
      chromeRuntime.id === TRUSTED_CHROME_EXTENSION_IDS.local
    )
  } else if (isTestEnv()) {
    return false
  } else {
    return getConfig().nodeEnv === NodeEnv.Development
  }
}

export function isBetaEnv(): boolean {
  if (isWebApp) {
    return getConfig().environment === Environment.Staging
  } else if (isExtensionApp) {
    const chromeRuntime = getChromeRuntime()
    if (!chromeRuntime) {
      // oxlint-disable-next-line no-console -- Console logging needed for debugging
      console.warn(
        'Avoid using `isBetaEnv()` inside the injected script. ' +
          '`chrome.runtime` is only available when the injected script is running inside a trusted site (`app.uniswap.org`). ' +
          'This helper always returns `false` when running inside the injected script on other websites.',
      )
      return false
    }

    return chromeRuntime.id === TRUSTED_CHROME_EXTENSION_IDS.beta
  } else if (isTestEnv()) {
    return false
  } else {
    throw createAndLogError('isBetaEnv')
  }
}

export function isProdEnv(): boolean {
  if (isWebApp) {
    return getConfig().nodeEnv === NodeEnv.Production && !isBetaEnv()
  } else if (isExtensionApp) {
    const chromeRuntime = getChromeRuntime()
    if (!chromeRuntime) {
      // oxlint-disable-next-line no-console -- Console logging needed for debugging
      console.warn(
        'Avoid using `isProdEnv()` inside the injected script. ' +
          '`chrome.runtime` is only available when the injected script is running inside a trusted site (`app.uniswap.org`). ' +
          'This helper always returns `true` when running inside the injected script on other websites.',
      )
      return true
    }

    return chromeRuntime.id === TRUSTED_CHROME_EXTENSION_IDS.prod
  } else if (isTestEnv()) {
    return false
  } else {
    throw createAndLogError('isProdEnv')
  }
}

function createAndLogError(funcName: string): Error {
  const e = new Error('Unsupported app environment that failed all checks')
  // oxlint-disable-next-line no-console -- Console logging needed for debugging
  console.error(`[utilities/env.web.ts/${funcName}]`, e)
  return e
}

export function isRNDev(): boolean {
  return false
}

export const localDevDatadogEnabled = false

export function isDatadogEnabled(): boolean {
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  return (localDevDatadogEnabled || !isRNDev()) && !isUnitTestEnv() && !isE2eTestEnv()
}
