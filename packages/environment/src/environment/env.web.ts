import { Environment, getConfig, NodeEnv } from '@universe/config'
import { getChromeRuntime } from '../chrome'
import { isExtensionApp, isWebApp } from '../platform'
import { TRUSTED_CHROME_EXTENSION_IDS } from './extensionId'

export const BUNDLE_ID = ''

type ExtensionRuntimeEnv = 'local' | 'dev' | 'beta' | 'prod'

/**
 * Resolves the extension's environment when `chrome.runtime` is available.
 *
 * Packed (Chrome Web Store) builds are authoritative by their trusted extension ID.
 * Unpacked / sideloaded builds (QA) get an unstable, randomly-assigned ID that matches
 * none of the trusted IDs — without a fallback every env helper returns `false`, leaving
 * the build in an incoherent state. For those we trust the build-time channel the build was
 * produced for (`buildEnv` from config), defaulting to `prod` to preserve prior behavior.
 *
 * Only call this when `getChromeRuntime()` returned a value — the injected-script case
 * (no `chrome.runtime`) is handled separately by each helper.
 */
function resolveExtensionEnv(runtimeId: string | undefined): ExtensionRuntimeEnv {
  if (runtimeId === TRUSTED_CHROME_EXTENSION_IDS.prod) {
    return 'prod'
  }
  if (runtimeId === TRUSTED_CHROME_EXTENSION_IDS.beta) {
    return 'beta'
  }
  if (runtimeId === TRUSTED_CHROME_EXTENSION_IDS.dev) {
    return 'dev'
  }
  if (runtimeId === TRUSTED_CHROME_EXTENSION_IDS.local || __DEV__) {
    return 'local'
  }
  // Untrusted/unstable ID (unpacked QA build): trust the build-time channel from config.
  switch (getConfig().buildEnv) {
    case 'dev':
      return 'dev'
    case 'beta':
      return 'beta'
    default:
      return 'prod'
  }
}

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

    const env = resolveExtensionEnv(chromeRuntime.id)
    return env === 'local' || env === 'dev'
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

    return resolveExtensionEnv(chromeRuntime.id) === 'beta'
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

    return resolveExtensionEnv(chromeRuntime.id) === 'prod'
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
