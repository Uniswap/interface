import { isExtension, isInterface } from 'uniswap/src/utils/platform'

const EXTENSION_ID_DEV = 'chrome-extension://afhngfaoadjjlhbgopehflaabbgfbcmn'
const EXTENSION_ID_BETA = 'chrome-extension://foilfbjokdonehdajefeadkclfpmhdga'
const EXTENSION_ID_PROD = 'chrome-extension://nnpmfplkfogfpmcngplhnbdnnilmcdcg'

export function isDevEnv(): boolean {
  if (isInterface) {
    return process.env.NODE_ENV === 'development'
  } else if (isExtension) {
    return __DEV__ || chrome.runtime.id === EXTENSION_ID_DEV
  } else {
    return false
  }
}

export function isBetaEnv(): boolean {
  if (isInterface) {
    // This is set in vercel builds and deploys from web/staging.
    return Boolean(process.env.REACT_APP_STAGING)
  } else if (isExtension) {
    return chrome.runtime.id === EXTENSION_ID_BETA
  } else {
    return false
  }
}

export function isProdEnv(): boolean {
  if (isInterface) {
    return process.env.NODE_ENV === 'production' && !isBetaEnv()
  } else if (isExtension) {
    return chrome.runtime.id === EXTENSION_ID_PROD
  } else {
    return false
  }
}
