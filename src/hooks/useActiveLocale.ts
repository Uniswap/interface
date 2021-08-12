import { DEFAULT_LOCALE, SupportedLocale, SUPPORTED_LOCALES } from 'constants/locales'
import { parse } from 'qs'
import { useEffect, useMemo } from 'react'
import { useUserLocale, useUserLocaleManager } from 'state/user/hooks'
import { initialState } from 'state'
import useParsedQueryString from './useParsedQueryString'

/**
 * Given a locale string (e.g. from user agent), return the best match for corresponding SupportedLocale
 * @param maybeSupportedLocale the fuzzy locale identifier
 */
function parseLocale(maybeSupportedLocale: string): SupportedLocale | undefined {
  const lowerMaybeSupportedLocale = maybeSupportedLocale.toLowerCase()
  return SUPPORTED_LOCALES.find(
    (locale) => locale.toLowerCase() === lowerMaybeSupportedLocale || locale.split('-')[0] === lowerMaybeSupportedLocale
  )
}

/**
 * Returns the supported locale read from the url query parameter (lng=)
 */
function urlLocale(): SupportedLocale | undefined {
  const search = location.search || location.hash.match(/\?.*/)?.[0]
  const parsed = search && search.length > 1 ? parse(search, { parseArrays: false, ignoreQueryPrefix: true }) : {}
  return typeof parsed.lng === 'string' ? parseLocale(parsed.lng) : undefined
}

/**
 * Returns the supported locale read from the user state (redux)
 */
function userLocale(): SupportedLocale | undefined {
  return initialState.user?.userLocale ?? undefined
}

/**
 * Returns the supported locale read from the user agent (navigator)
 */
export function navigatorLocale(): SupportedLocale | undefined {
  if (!navigator.language) return undefined

  const [language, region] = navigator.language.split('-')

  if (region) {
    return parseLocale(`${language}-${region.toUpperCase()}`) ?? parseLocale(language)
  }

  return parseLocale(language)
}

/**
 * Returns the initial locale from query string, user state (redux), or user agent
 */
export function initialLocale(): SupportedLocale {
  return urlLocale() ?? userLocale() ?? navigatorLocale() ?? DEFAULT_LOCALE
}

export function useSetLocaleFromUrl() {
  const parsed = useParsedQueryString()
  const [userLocale, setUserLocale] = useUserLocaleManager()

  useEffect(() => {
    const urlLocale = typeof parsed.lng === 'string' ? parseLocale(parsed.lng) : undefined
    if (urlLocale && urlLocale !== userLocale) {
      setUserLocale(urlLocale)
    }
  }, [parsed.lng, setUserLocale, userLocale])
}

/**
 * Returns the currently active locale from query string, user state (redux), or user agent
 */
export function useActiveLocale(): SupportedLocale {
  const userLocale = useUserLocale()

  return useMemo(() => {
    return userLocale ?? navigatorLocale() ?? DEFAULT_LOCALE
  }, [userLocale])
}
