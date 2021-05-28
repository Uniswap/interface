import { DEFAULT_LOCALE, SupportedLocale, SUPPORTED_LOCALES } from 'constants/locales'
import { useMemo } from 'react'
import { useUserLocale } from 'state/user/hooks'
import useParsedQueryString from './useParsedQueryString'

function parseLocale(maybeSupportedLocale: string): SupportedLocale | undefined {
  return SUPPORTED_LOCALES.find((locale) => locale === maybeSupportedLocale)
}

function navigatorLocale(): SupportedLocale | undefined {
  if (!navigator.language) return undefined

  const [language, region] = navigator.language.split('-')

  if (region) {
    return parseLocale(`${language}-${region.toUpperCase()}`) ?? parseLocale(language)
  }

  return parseLocale(language)
}

export function useActiveLocale(): SupportedLocale {
  const parsed = useParsedQueryString()
  const userLocale = useUserLocale()

  return useMemo(() => {
    const urlLocale = () => (typeof parsed.lng === 'string' && parseLocale(parsed.lng)) || undefined

    return userLocale ?? urlLocale() ?? navigatorLocale() ?? DEFAULT_LOCALE
  }, [userLocale, parsed])
}
