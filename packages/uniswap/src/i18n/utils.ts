import {
  Language,
  Locale,
  PLATFORM_SUPPORTED_LANGUAGES,
  mapDeviceLanguageToLanguage,
  mapLocaleToLanguage,
} from 'uniswap/src/features/language/constants'
import { getLocale } from 'uniswap/src/features/language/hooks'
import { getDeviceLocales } from 'utilities/src/device/locales'
import { logger } from 'utilities/src/logger/logger'

/**
 * Determines the device locale for Mobile and Chrome Extension.
 */
export function getWalletDeviceLocale(): Locale {
  const language = getWalletDeviceLanguage()
  return getLocale(language)
}

/**
 * Determines the device language for Mobile and Chrome Extension.
 */
export function getWalletDeviceLanguage(): Language {
  try {
    // Gets the user device locales in order of their preference
    const deviceLocales = getDeviceLocales()

    for (const locale of deviceLocales) {
      // Normalizes language tags like 'zh-Hans-ch' to 'zh-Hans' that could happen on Android
      const normalizedLanguageTag = locale.languageTag.split('-').slice(0, 2).join('-') as Locale
      const mappedLanguageFromTag = Object.values(Locale).includes(normalizedLanguageTag)
        ? mapLocaleToLanguage[normalizedLanguageTag]
        : mapDeviceLanguageToLanguage[normalizedLanguageTag]
      const mappedLanguageFromCode = locale.languageCode as Maybe<Language>
      // Prefer languageTag as it's more specific, falls back to languageCode
      const mappedLanguage = mappedLanguageFromTag || mappedLanguageFromCode

      if (mappedLanguage && PLATFORM_SUPPORTED_LANGUAGES.includes(mappedLanguage)) {
        return mappedLanguage
      }
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'i18n/utils.ts', function: 'getWalletDeviceLanguage' },
    })
  }

  // Default to English if no supported language is found
  return Language.English
}
