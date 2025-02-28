import { logger } from 'utilities/src/logger/logger'
import { isExtension, isInterface } from 'utilities/src/platform'

const EXTENSION_ID_LOCAL = 'ceofpnbcmdjbibjjdniemjemmgaibeih'
const EXTENSION_ID_DEV = 'afhngfaoadjjlhbgopehflaabbgfbcmn'
const EXTENSION_ID_BETA = 'foilfbjokdonehdajefeadkclfpmhdga'
const EXTENSION_ID_PROD = 'nnpmfplkfogfpmcngplhnbdnnilmcdcg'

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
    return __DEV__ || chrome.runtime.id === EXTENSION_ID_DEV || chrome.runtime.id === EXTENSION_ID_LOCAL
  } else if (isTestEnv()) {
    return false
  } else {
    throw createAndLogError('isDevEnv')
  }
}

export function isBetaEnv(): boolean {
  if (isInterface) {
    // This is set in vercel builds and deploys from web/staging.
    return Boolean(process.env.REACT_APP_STAGING)
  } else if (isExtension) {
    return chrome.runtime.id === EXTENSION_ID_BETA
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
    return chrome.runtime.id === EXTENSION_ID_PROD
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
