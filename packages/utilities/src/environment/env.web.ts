import { TRUSTED_CHROME_EXTENSION_IDS } from 'utilities/src/environment/extensionId'
import { logger } from 'utilities/src/logger/logger'
import { isExtension, isInterface } from 'utilities/src/platform'

export function isTestEnv(): boolean {
  return (
    !!process.env.JEST_WORKER_ID ||
    process.env.NODE_ENV === 'test' ||
    !!(typeof window !== 'undefined' && window.Cypress) ||
    !!isPlaywrightEnv()
  )
}

export function isPlaywrightEnv(): boolean {
  return typeof window !== 'undefined' && typeof window.__playwright__binding__ !== 'undefined'
}

export function isDevEnv(): boolean {
  if (isInterface) {
    return process.env.NODE_ENV === 'development'
  } else if (isExtension) {
    if (!chrome.runtime) {
      // eslint-disable-next-line no-console
      console.warn(
        'Avoid using `isDevEnv()` inside the injected script. Use `__DEV__` instead. ' +
          '`chrome.runtime` is only available when the injected script is running inside a trusted site (`app.uniswap.org`). ' +
          'This helper only works reliably when running the app locally but not when publishing the Dev build.',
      )
      return __DEV__
    }

    return (
      __DEV__ ||
      chrome.runtime.id === TRUSTED_CHROME_EXTENSION_IDS.dev ||
      chrome.runtime.id === TRUSTED_CHROME_EXTENSION_IDS.local
    )
  } else if (isTestEnv()) {
    return false
  } else {
    throw createAndLogError('isDevEnv')
  }
}

export function isBetaEnv(): boolean {
  if (isInterface) {
    // This is set in vercel builds for all pre-production envs, including `web/staging` and all other branches.
    return Boolean(process.env.REACT_APP_STAGING)
  } else if (isExtension) {
    if (!chrome.runtime) {
      // eslint-disable-next-line no-console
      console.warn(
        'Avoid using `isBetaEnv()` inside the injected script. ' +
          '`chrome.runtime` is only available when the injected script is running inside a trusted site (`app.uniswap.org`). ' +
          'This helper always returns `false` when running inside the injected script on other websites.',
      )
      return false
    }

    return chrome.runtime.id === TRUSTED_CHROME_EXTENSION_IDS.beta
  } else if (isTestEnv()) {
    return false
  } else {
    throw createAndLogError('isBetaEnv')
  }
}

export function isProdEnv(): boolean {
  if (isInterface) {
    return process.env.NODE_ENV === 'production' && !isBetaEnv()
  } else if (isExtension) {
    if (!chrome.runtime) {
      // eslint-disable-next-line no-console
      console.warn(
        'Avoid using `isProdEnv()` inside the injected script. ' +
          '`chrome.runtime` is only available when the injected script is running inside a trusted site (`app.uniswap.org`). ' +
          'This helper always returns `true` when running inside the injected script on other websites.',
      )
      return true
    }

    return chrome.runtime.id === TRUSTED_CHROME_EXTENSION_IDS.prod
  } else if (isTestEnv()) {
    return false
  } else {
    throw createAndLogError('isProdEnv')
  }
}

function createAndLogError(funcName: string): Error {
  const e = new Error('Unsupported app environment that failed all checks')
  logger.error(e, {
    tags: {
      file: 'utilities/src/environment/env.web.ts',
      function: funcName,
    },
  })
  return e
}

export function isRNDev(): boolean {
  return false
}
