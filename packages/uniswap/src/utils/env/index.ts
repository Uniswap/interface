import { logger } from 'utilities/src/logger/logger'
import { isExtension, isInterface } from 'utilities/src/platform'

const EXTENSION_ID_LOCAL = 'ceofpnbcmdjbibjjdniemjemmgaibeih'
const EXTENSION_ID_DEV = 'afhngfaoadjjlhbgopehflaabbgfbcmn'
const EXTENSION_ID_BETA = 'foilfbjokdonehdajefeadkclfpmhdga'
const EXTENSION_ID_PROD = 'nnpmfplkfogfpmcngplhnbdnnilmcdcg'

export function isDevEnv(): boolean {
  if (isInterface) {
    return process.env.NODE_ENV === 'development'
  } else if (isExtension) {
    return __DEV__ || chrome.runtime.id === EXTENSION_ID_DEV || chrome.runtime.id === EXTENSION_ID_LOCAL
  } else {
    throw createAndLogError('isProdEnv')
  }
}

export function isBetaEnv(): boolean {
  if (isInterface) {
    // This is set in vercel builds and deploys from web/staging.
    return Boolean(process.env.REACT_APP_STAGING)
  } else if (isExtension) {
    return chrome.runtime.id === EXTENSION_ID_BETA
  } else {
    throw createAndLogError('isBetaEnv')
  }
}

export function isProdEnv(): boolean {
  if (isInterface) {
    return process.env.NODE_ENV === 'production' && !isBetaEnv()
  } else if (isExtension) {
    return chrome.runtime.id === EXTENSION_ID_PROD
  } else {
    throw createAndLogError('isProdEnv')
  }
}

function createAndLogError(funcName: string): Error {
  const e = new Error('Unsupported app environment that failed all checks')
  logger.error(e, {
    tags: {
      file: 'uniswap/src/utils/env/index.ts',
      function: funcName,
    },
  })
  return e
}
