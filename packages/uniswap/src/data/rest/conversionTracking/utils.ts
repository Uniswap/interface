import { namehash } from '@ethersproject/hash'
import ms from 'ms'
import {
  CONVERSION_LEADS_EXTERNAL_COOKIE_DOMAIN,
  CONVERSION_LEADS_EXTERNAL_COOKIE_NAME,
  DEV_CONVERSION_PROXY_API_BASE_URL,
  DEV_CONVERSION_PROXY_API_BASE_URL_DEPRECATED,
  PROD_CONVERSION_PROXY_API_BASE_URL,
  PROD_CONVERSION_PROXY_API_BASE_URL_DEPRECATED,
  STAGING_CONVERSION_PROXY_API_BASE_URL,
  STAGING_CONVERSION_PROXY_API_BASE_URL_DEPRECATED,
} from 'uniswap/src/data/rest/conversionTracking/constants'
import { PlatformIdType } from 'uniswap/src/data/rest/conversionTracking/types'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'

const JITTER_MIN_MS = ms('10d')
const JITTER_MAX_MS = ms('14d')

const getJitter = (): number => {
  const min = Math.ceil(JITTER_MIN_MS)
  const max = Math.floor(JITTER_MAX_MS)

  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const addJitter = (date: Date): Date => {
  return new Date(date.valueOf() + getJitter())
}

export const hashAddress = (address: Address): string => namehash(address)

export const getExternalConversionLeadsCookie = (): { key: PlatformIdType; value: string } | void => {
  // Note: External cookie will be set from other uniswap subdomains (e.g. wallet.uniswap.org)
  const cookieValue = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(CONVERSION_LEADS_EXTERNAL_COOKIE_NAME))
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    ?.split('=')?.[1]

  let parsedCookie
  try {
    parsedCookie = cookieValue ? JSON.parse(cookieValue) : null
  } catch (_e) {}

  let result
  if (parsedCookie) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const key = Object.keys(parsedCookie)?.[0]
    if (key) {
      result = {
        key: key as PlatformIdType,
        value: parsedCookie[key],
      }
    }

    // Delete the cookie
    document.cookie = `${CONVERSION_LEADS_EXTERNAL_COOKIE_NAME}=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${CONVERSION_LEADS_EXTERNAL_COOKIE_DOMAIN}`
  }

  return result
}

export const getConversionProxyApiBaseUrl = (isConversionApiMigrationEnabled: boolean): string => {
  if (isConversionApiMigrationEnabled) {
    if (isDevEnv()) {
      return DEV_CONVERSION_PROXY_API_BASE_URL
    } else if (isBetaEnv()) {
      return STAGING_CONVERSION_PROXY_API_BASE_URL
    } else {
      return PROD_CONVERSION_PROXY_API_BASE_URL
    }
  }

  if (isDevEnv()) {
    return DEV_CONVERSION_PROXY_API_BASE_URL_DEPRECATED
  } else if (isBetaEnv()) {
    return STAGING_CONVERSION_PROXY_API_BASE_URL_DEPRECATED
  } else {
    return PROD_CONVERSION_PROXY_API_BASE_URL_DEPRECATED
  }
}
