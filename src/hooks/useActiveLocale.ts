import { DEFAULT_LOCALE, SupportedLocale, SUPPORTED_LOCALES } from 'constants/locales'
import { useMemo } from 'react'
import { useUserLocale } from 'state/user/hooks'
import useParsedQueryString from './useParsedQueryString'

/**
 * Mapping from locales without region (e.g. es) to the default region specific locale (e.g. es-US)
 */
const MAPPED_DEFAULT_LOCALES: { [localeWithoutRegion: string]: SupportedLocale } = {}

/**
 * Given a locale string (e.g. from user agent), return the best match for corresponding SupportedLocale
 * @param maybeSupportedLocale the fuzzy locale identifier
 */
function parseLocale(maybeSupportedLocale: string): SupportedLocale | undefined {
  return (
    MAPPED_DEFAULT_LOCALES[maybeSupportedLocale.toLowerCase()] ??
    SUPPORTED_LOCALES.find((locale) => locale === maybeSupportedLocale)
  )
}

/**
 * Returns the supported locale read from the user agent (navigator)
 */
function navigatorLocale(): SupportedLocale | undefined {
  if (!navigator.language) return undefined

  const [language, region] = navigator.language.split('-')

  if (region) {
    return parseLocale(`${language}-${region.toUpperCase()}`) ?? parseLocale(language)
  }

  return parseLocale(language)
}

/**
 * Returns the currently active locale, from a combination of user agent, query string, and user settings stored in redux
 */
export function useActiveLocale(): SupportedLocale {
  const parsed = useParsedQueryString()
  const userLocale = useUserLocale()

  return useMemo(() => {
    const urlLocale = () => (typeof parsed.lng === 'string' && parseLocale(parsed.lng)) || undefined

    return userLocale ?? urlLocale() ?? navigatorLocale() ?? DEFAULT_LOCALE
  }, [userLocale, parsed])
}
