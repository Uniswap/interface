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
  name: string
  originName: string // name of language in that language
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
        name: t('Chinese, Simplified'),
        originName: t('Chinese, Simplified', { lng: getLocale(Language.ChineseSimplified) }),
        locale: getLocale(Language.ChineseSimplified),
      },
      [Language.ChineseTraditional]: {
        name: t('Chinese, Traditional'),
        originName: t('Chinese, Traditional', { lng: getLocale(Language.ChineseTraditional) }),
        locale: getLocale(Language.ChineseTraditional),
      },
      [Language.Dutch]: {
        name: t('Dutch'),
        originName: t('Dutch', { lng: getLocale(Language.Dutch) }),
        locale: getLocale(Language.Dutch),
      },
      [Language.English]: {
        name: t('English'),
        originName: t('English', { lng: getLocale(Language.English) }),
        locale: getLocale(Language.English),
      },
      [Language.French]: {
        name: t('French'),
        originName: t('French', { lng: getLocale(Language.French) }),
        locale: getLocale(Language.French),
      },
      [Language.Hindi]: {
        name: t('Hindi'),
        originName: t('Hindi', { lng: getLocale(Language.Hindi) }),
        locale: getLocale(Language.Hindi),
      },
      [Language.Indonesian]: {
        name: t('Indonesian'),
        originName: t('Indonesian', { lng: getLocale(Language.Indonesian) }),
        locale: getLocale(Language.Indonesian),
      },
      [Language.Japanese]: {
        name: t('Japanese'),
        originName: t('Japanese', { lng: getLocale(Language.Japanese) }),
        locale: getLocale(Language.Japanese),
      },
      [Language.Malay]: {
        name: t('Malay'),
        originName: t('Malay', { lng: getLocale(Language.Malay) }),
        locale: getLocale(Language.Malay),
      },
      [Language.Portuguese]: {
        name: t('Portuguese'),
        originName: t('Portuguese', { lng: getLocale(Language.Portuguese) }),
        locale: getLocale(Language.Portuguese),
      },
      [Language.Russian]: {
        name: t('Russian'),
        originName: t('Russian', { lng: getLocale(Language.Russian) }),
        locale: getLocale(Language.Russian),
      },
      [Language.SpanishSpain]: {
        name: t('Spanish (Spain)'),
        originName: t('Spanish (Spain)', { lng: getLocale(Language.SpanishSpain) }),
        locale: getLocale(Language.SpanishSpain),
      },
      [Language.SpanishLatam]: {
        name: t('Spanish (Latin America)'),
        originName: t('Spanish (Latin America)', { lng: getLocale(Language.SpanishLatam) }),
        locale: getLocale(Language.SpanishLatam),
      },
      [Language.SpanishUnitedStates]: {
        name: t('Spanish (US)'),
        originName: t('Spanish (US)', { lng: getLocale(Language.SpanishUnitedStates) }),
        locale: getLocale(Language.SpanishUnitedStates),
      },
      [Language.Thai]: {
        name: t('Thai'),
        originName: t('Thai', { lng: getLocale(Language.Thai) }),
        locale: getLocale(Language.Thai),
      },
      [Language.Turkish]: {
        name: t('Turkish'),
        originName: t('Turkish', { lng: getLocale(Language.Turkish) }),
        locale: getLocale(Language.Turkish),
      },
      [Language.Ukrainian]: {
        name: t('Ukrainian'),
        originName: t('Ukrainian', { lng: getLocale(Language.Ukrainian) }),
        locale: getLocale(Language.Ukrainian),
      },
      [Language.Urdu]: {
        name: t('Urdu'),
        originName: t('Urdu', { lng: getLocale(Language.Urdu) }),
        locale: getLocale(Language.Urdu),
      },
      [Language.Vietnamese]: {
        name: t('Vietnamese'),
        originName: t('Vietnamese', { lng: getLocale(Language.Vietnamese) }),
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
