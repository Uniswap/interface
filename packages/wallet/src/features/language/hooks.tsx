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
        displayName: t('Chinese, Simplified'),
        originName: t('Chinese, Simplified', { lng: getLocale(Language.ChineseSimplified) }),
        loggingName: 'Chinese, Simplified',
        locale: getLocale(Language.ChineseSimplified),
      },
      [Language.ChineseTraditional]: {
        displayName: t('Chinese, Traditional'),
        originName: t('Chinese, Traditional', { lng: getLocale(Language.ChineseTraditional) }),
        loggingName: 'Chinese, Traditional',
        locale: getLocale(Language.ChineseTraditional),
      },
      [Language.Dutch]: {
        displayName: t('Dutch'),
        originName: t('Dutch', { lng: getLocale(Language.Dutch) }),
        loggingName: 'Dutch',
        locale: getLocale(Language.Dutch),
      },
      [Language.English]: {
        displayName: t('English'),
        originName: t('English', { lng: getLocale(Language.English) }),
        loggingName: 'English',
        locale: getLocale(Language.English),
      },
      [Language.French]: {
        displayName: t('French'),
        originName: t('French', { lng: getLocale(Language.French) }),
        loggingName: 'French',
        locale: getLocale(Language.French),
      },
      [Language.Hindi]: {
        displayName: t('Hindi'),
        originName: t('Hindi', { lng: getLocale(Language.Hindi) }),
        loggingName: 'Hindi',
        locale: getLocale(Language.Hindi),
      },
      [Language.Indonesian]: {
        displayName: t('Indonesian'),
        originName: t('Indonesian', { lng: getLocale(Language.Indonesian) }),
        loggingName: 'Indonesian',
        locale: getLocale(Language.Indonesian),
      },
      [Language.Japanese]: {
        displayName: t('Japanese'),
        originName: t('Japanese', { lng: getLocale(Language.Japanese) }),
        loggingName: 'Japanese',
        locale: getLocale(Language.Japanese),
      },
      [Language.Malay]: {
        displayName: t('Malay'),
        originName: t('Malay', { lng: getLocale(Language.Malay) }),
        loggingName: 'Malay',
        locale: getLocale(Language.Malay),
      },
      [Language.Portuguese]: {
        displayName: t('Portuguese'),
        originName: t('Portuguese', { lng: getLocale(Language.Portuguese) }),
        loggingName: 'Portuguese',
        locale: getLocale(Language.Portuguese),
      },
      [Language.Russian]: {
        displayName: t('Russian'),
        originName: t('Russian', { lng: getLocale(Language.Russian) }),
        loggingName: 'Russian',
        locale: getLocale(Language.Russian),
      },
      [Language.SpanishSpain]: {
        displayName: t('Spanish (Spain)'),
        originName: t('Spanish (Spain)', { lng: getLocale(Language.SpanishSpain) }),
        loggingName: 'Spanish (Spain)',
        locale: getLocale(Language.SpanishSpain),
      },
      [Language.SpanishLatam]: {
        displayName: t('Spanish (Latin America)'),
        originName: t('Spanish (Latin America)', { lng: getLocale(Language.SpanishLatam) }),
        loggingName: 'Spanish (Latin America)',
        locale: getLocale(Language.SpanishLatam),
      },
      [Language.SpanishUnitedStates]: {
        displayName: t('Spanish (US)'),
        originName: t('Spanish (US)', { lng: getLocale(Language.SpanishUnitedStates) }),
        loggingName: 'Spanish (US)',
        locale: getLocale(Language.SpanishUnitedStates),
      },
      [Language.Thai]: {
        displayName: t('Thai'),
        originName: t('Thai', { lng: getLocale(Language.Thai) }),
        loggingName: 'Thai',
        locale: getLocale(Language.Thai),
      },
      [Language.Turkish]: {
        displayName: t('Turkish'),
        originName: t('Turkish', { lng: getLocale(Language.Turkish) }),
        loggingName: 'Turkish',
        locale: getLocale(Language.Turkish),
      },
      [Language.Ukrainian]: {
        displayName: t('Ukrainian'),
        originName: t('Ukrainian', { lng: getLocale(Language.Ukrainian) }),
        loggingName: 'Ukrainian',
        locale: getLocale(Language.Ukrainian),
      },
      [Language.Urdu]: {
        displayName: t('Urdu'),
        originName: t('Urdu', { lng: getLocale(Language.Urdu) }),
        loggingName: 'Urdu',
        locale: getLocale(Language.Urdu),
      },
      [Language.Vietnamese]: {
        displayName: t('Vietnamese'),
        originName: t('Vietnamese', { lng: getLocale(Language.Vietnamese) }),
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
