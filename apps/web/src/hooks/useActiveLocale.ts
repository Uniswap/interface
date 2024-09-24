import useParsedQueryString from 'hooks/useParsedQueryString'
import { useMemo } from 'react'
import store from 'state'
import {
  DEFAULT_LOCALE,
  Language,
  Locale,
  WEB_SUPPORTED_LANGUAGES,
  mapLocaleToLanguage,
} from 'uniswap/src/features/language/constants'
import { getLocale, useCurrentLocale } from 'uniswap/src/features/language/hooks'

/**
 * Given a locale string (e.g. from user agent), return the best match for corresponding Locale enum object
 * @param maybeSupportedLocale the fuzzy locale identifier
 */
export function parseLocale(maybeSupportedLocale: unknown): Locale | undefined {
  if (typeof maybeSupportedLocale !== 'string') {
    return undefined
  }
  const lowerMaybeSupportedLocale = maybeSupportedLocale.toLowerCase()
  return WEB_SUPPORTED_LANGUAGES.map((lang) => getLocale(lang)).find(
    (locale) =>
      locale.toLowerCase() === lowerMaybeSupportedLocale || locale.split('-')[0] === lowerMaybeSupportedLocale,
  )
}

/**
 * Returns the supported locale read from the user agent (navigator)
 */
export function navigatorLocale(): Locale | undefined {
  if (!navigator.language) {
    return undefined
  }

  const [language, region] = navigator.language.split('-')

  if (region) {
    return parseLocale(`${language}-${region.toUpperCase()}`) ?? parseLocale(language)
  }

  return parseLocale(language)
}

export function storeLocale(): Locale | undefined {
  const storeLanguage = store.getState().userSettings.currentLanguage
  return getLocale(storeLanguage)
}

function useUrlLocale() {
  const parsed = useParsedQueryString()
  return parseLocale(parsed.lng)
}

/**
 * Returns the currently active locale, from a combination of user agent, query string, and user settings stored in redux
 */
export function useActiveLocale(): Locale {
  const urlLocale = useUrlLocale()
  const userLocale = useCurrentLocale()
  return useMemo(() => urlLocale ?? userLocale ?? navigatorLocale() ?? DEFAULT_LOCALE, [urlLocale, userLocale])
}

export function useActiveLanguage(): Language {
  const locale = useActiveLocale()
  return mapLocaleToLanguage[locale]
}
