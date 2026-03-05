import {
  Language,
  Locale,
  mapLanguageToLocale,
  PLATFORM_SUPPORTED_LANGUAGES,
} from 'uniswap/src/features/language/constants'

/**
 * Helper function used get the locale from the language. They're strongly associated,
 * but they have different ISO values and are used differently. Locale is what's mainly
 * used for integrations with other libraries, while language is more internal
 * @param language target language
 * @returns associated locale
 */
export function getLocale(language: Language): Locale {
  return mapLanguageToLocale[language]
}

/**
 * Given a locale string (e.g. from user agent), return the best match for corresponding Locale enum object
 * @param maybeSupportedLocale the fuzzy locale identifier
 */
export function parseLocale(maybeSupportedLocale: unknown): Locale | undefined {
  if (typeof maybeSupportedLocale !== 'string') {
    return undefined
  }
  const lowerMaybeSupportedLocale = maybeSupportedLocale.toLowerCase()
  return PLATFORM_SUPPORTED_LANGUAGES.map((lang) => getLocale(lang)).find(
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
