import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Language, Locale, mapLanguageToLocale } from 'wallet/src/features/language/constants'
import { selectCurrentLanguage } from 'wallet/src/features/language/slice'
import { useAppSelector } from 'wallet/src/state'

/**
 * Hook used to get the currently selected language for the app
 * @returns currently selected language enum
 */
export function useCurrentLanguage(): Language {
  return useAppSelector(selectCurrentLanguage)
}

export type LanguageInfo = {
  displayName: string
  originName: string // name of language in that language
  loggingName: string // internal only name to be used in logging
  locale: Locale
}

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
 * Returns all relevant info for the target language, including the translated name of
 * that language in that language (not a typo).
 * @param language target language
 * @returns all relevant language info
 */
export function useLanguageInfo(language: Language): LanguageInfo {
  const { t } = useTranslation()

  const languageToLanguageInfo = useMemo((): Record<Language, LanguageInfo> => {
    return {
      [Language.ChineseSimplified]: {
        displayName: t('language.chineseSimplified'),
        originName: t('language.chineseSimplified', { lng: getLocale(Language.ChineseSimplified) }),
        loggingName: 'Chinese, Simplified',
        locale: getLocale(Language.ChineseSimplified),
      },
      [Language.ChineseTraditional]: {
        displayName: t('language.chineseTraditional'),
        originName: t('language.chineseTraditional', {
          lng: getLocale(Language.ChineseTraditional),
        }),
        loggingName: 'Chinese, Traditional',
        locale: getLocale(Language.ChineseTraditional),
      },
      [Language.Dutch]: {
        displayName: t('language.dutch'),
        originName: t('language.dutch', { lng: getLocale(Language.Dutch) }),
        loggingName: 'Dutch',
        locale: getLocale(Language.Dutch),
      },
      [Language.English]: {
        displayName: t('language.english'),
        originName: t('language.english', { lng: getLocale(Language.English) }),
        loggingName: 'English',
        locale: getLocale(Language.English),
      },
      [Language.French]: {
        displayName: t('language.french'),
        originName: t('language.french', { lng: getLocale(Language.French) }),
        loggingName: 'French',
        locale: getLocale(Language.French),
      },
      [Language.Hindi]: {
        displayName: t('language.hindi'),
        originName: t('language.hindi', { lng: getLocale(Language.Hindi) }),
        loggingName: 'Hindi',
        locale: getLocale(Language.Hindi),
      },
      [Language.Indonesian]: {
        displayName: t('language.indonesian'),
        originName: t('language.indonesian', { lng: getLocale(Language.Indonesian) }),
        loggingName: 'Indonesian',
        locale: getLocale(Language.Indonesian),
      },
      [Language.Japanese]: {
        displayName: t('language.japanese'),
        originName: t('language.japanese', { lng: getLocale(Language.Japanese) }),
        loggingName: 'Japanese',
        locale: getLocale(Language.Japanese),
      },
      [Language.Malay]: {
        displayName: t('language.malay'),
        originName: t('language.malay', { lng: getLocale(Language.Malay) }),
        loggingName: 'Malay',
        locale: getLocale(Language.Malay),
      },
      [Language.Portuguese]: {
        displayName: t('language.portuguese'),
        originName: t('language.portuguese', { lng: getLocale(Language.Portuguese) }),
        loggingName: 'Portuguese',
        locale: getLocale(Language.Portuguese),
      },
      [Language.Russian]: {
        displayName: t('language.russian'),
        originName: t('language.russian', { lng: getLocale(Language.Russian) }),
        loggingName: 'Russian',
        locale: getLocale(Language.Russian),
      },
      [Language.SpanishSpain]: {
        displayName: t('language.spanishSpain'),
        originName: t('language.spanishSpain', { lng: getLocale(Language.SpanishSpain) }),
        loggingName: 'Spanish (Spain)',
        locale: getLocale(Language.SpanishSpain),
      },
      [Language.SpanishLatam]: {
        displayName: t('language.spanishLatam'),
        originName: t('language.spanishLatam', { lng: getLocale(Language.SpanishLatam) }),
        loggingName: 'Spanish (Latin America)',
        locale: getLocale(Language.SpanishLatam),
      },
      [Language.SpanishUnitedStates]: {
        displayName: t('language.spanishUs'),
        originName: t('language.spanishUs', { lng: getLocale(Language.SpanishUnitedStates) }),
        loggingName: 'Spanish (US)',
        locale: getLocale(Language.SpanishUnitedStates),
      },
      [Language.Thai]: {
        displayName: t('language.thai'),
        originName: t('language.thai', { lng: getLocale(Language.Thai) }),
        loggingName: 'Thai',
        locale: getLocale(Language.Thai),
      },
      [Language.Turkish]: {
        displayName: t('language.turkish'),
        originName: t('language.turkish', { lng: getLocale(Language.Turkish) }),
        loggingName: 'Turkish',
        locale: getLocale(Language.Turkish),
      },
      [Language.Ukrainian]: {
        displayName: t('language.ukrainian'),
        originName: t('language.ukrainian', { lng: getLocale(Language.Ukrainian) }),
        loggingName: 'Ukrainian',
        locale: getLocale(Language.Ukrainian),
      },
      [Language.Urdu]: {
        displayName: t('language.urdu'),
        originName: t('language.urdu', { lng: getLocale(Language.Urdu) }),
        loggingName: 'Urdu',
        locale: getLocale(Language.Urdu),
      },
      [Language.Vietnamese]: {
        displayName: t('language.vietnamese'),
        originName: t('language.vietnamese', { lng: getLocale(Language.Vietnamese) }),
        loggingName: 'Vietnamese',
        locale: getLocale(Language.Vietnamese),
      },
    }
  }, [t])

  return languageToLanguageInfo[language]
}

/**
 * Hook used to get the locale for the currently selected language in the app
 * @returns locale for the currently selected language
 */
export function useCurrentLocale(): Locale {
  const currentLanguage = useCurrentLanguage()
  return getLocale(currentLanguage)
}

/**
 * Hook used to get all relevant info for the currently selected language in the app
 * @returns all relevant language info
 */
export function useCurrentLanguageInfo(): LanguageInfo {
  const currentLanguage = useCurrentLanguage()
  return useLanguageInfo(currentLanguage)
}
