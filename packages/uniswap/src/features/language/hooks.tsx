import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { AppTFunction } from 'ui/src/i18n/types'
import { Language, Locale, mapLanguageToLocale } from 'uniswap/src/features/language/constants'
import { selectCurrentLanguage } from 'uniswap/src/features/settings/selectors'

/**
 * Hook used to get the currently selected language for the app
 * @returns currently selected language enum
 */
export function useCurrentLanguage(): Language {
  return useSelector(selectCurrentLanguage)
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
export function getLanguageInfo(t: AppTFunction, language: Language): LanguageInfo {
  const languageToLanguageInfo: Record<Language, LanguageInfo> = {
    [Language.Afrikaans]: {
      displayName: t('language.afrikaans'),
      originName: t('language.afrikaans', { lng: getLocale(Language.Afrikaans) }),
      loggingName: 'Afrikaans',
      locale: getLocale(Language.Afrikaans),
    },
    [Language.Arabic]: {
      displayName: t('language.arabic'),
      originName: t('language.arabic', { lng: getLocale(Language.Arabic) }),
      loggingName: 'Arabic',
      locale: getLocale(Language.Arabic),
    },
    [Language.Catalan]: {
      displayName: t('language.catalan'),
      originName: t('language.catalan', { lng: getLocale(Language.Catalan) }),
      loggingName: 'Catalan',
      locale: getLocale(Language.Catalan),
    },
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
    [Language.Czech]: {
      displayName: t('language.czech'),
      originName: t('language.czech', { lng: getLocale(Language.Czech) }),
      loggingName: 'Czech',
      locale: getLocale(Language.Czech),
    },
    [Language.Danish]: {
      displayName: t('language.danish'),
      originName: t('language.danish', { lng: getLocale(Language.Danish) }),
      loggingName: 'Danish',
      locale: getLocale(Language.Danish),
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
    [Language.Finnish]: {
      displayName: t('language.finnish'),
      originName: t('language.finnish', { lng: getLocale(Language.Finnish) }),
      loggingName: 'Finnish',
      locale: getLocale(Language.Finnish),
    },
    [Language.French]: {
      displayName: t('language.french'),
      originName: t('language.french', { lng: getLocale(Language.French) }),
      loggingName: 'French',
      locale: getLocale(Language.French),
    },
    [Language.Greek]: {
      displayName: t('language.greek'),
      originName: t('language.greek', { lng: getLocale(Language.Greek) }),
      loggingName: 'Greek',
      locale: getLocale(Language.Greek),
    },
    [Language.Hebrew]: {
      displayName: t('language.hebrew'),
      originName: t('language.hebrew', { lng: getLocale(Language.Hebrew) }),
      loggingName: 'Hebrew',
      locale: getLocale(Language.Hebrew),
    },
    [Language.Hindi]: {
      displayName: t('language.hindi'),
      originName: t('language.hindi', { lng: getLocale(Language.Hindi) }),
      loggingName: 'Hindi',
      locale: getLocale(Language.Hindi),
    },
    [Language.Hungarian]: {
      displayName: t('language.hungarian'),
      originName: t('language.hungarian', { lng: getLocale(Language.Hungarian) }),
      loggingName: 'Hungarian',
      locale: getLocale(Language.Hungarian),
    },
    [Language.Indonesian]: {
      displayName: t('language.indonesian'),
      originName: t('language.indonesian', { lng: getLocale(Language.Indonesian) }),
      loggingName: 'Indonesian',
      locale: getLocale(Language.Indonesian),
    },
    [Language.Italian]: {
      displayName: t('language.italian'),
      originName: t('language.italian', { lng: getLocale(Language.Italian) }),
      loggingName: 'Italian',
      locale: getLocale(Language.Italian),
    },
    [Language.Japanese]: {
      displayName: t('language.japanese'),
      originName: t('language.japanese', { lng: getLocale(Language.Japanese) }),
      loggingName: 'Japanese',
      locale: getLocale(Language.Japanese),
    },
    [Language.Korean]: {
      displayName: t('language.korean'),
      originName: t('language.korean', { lng: getLocale(Language.Korean) }),
      loggingName: 'Korean',
      locale: getLocale(Language.Korean),
    },
    [Language.Malay]: {
      displayName: t('language.malay'),
      originName: t('language.malay', { lng: getLocale(Language.Malay) }),
      loggingName: 'Malay',
      locale: getLocale(Language.Malay),
    },
    [Language.Norwegian]: {
      displayName: t('language.norwegian'),
      originName: t('language.norwegian', { lng: getLocale(Language.Norwegian) }),
      loggingName: 'Norweigan',
      locale: getLocale(Language.Norwegian),
    },
    [Language.Polish]: {
      displayName: t('language.polish'),
      originName: t('language.polish', { lng: getLocale(Language.Polish) }),
      loggingName: 'Polish',
      locale: getLocale(Language.Polish),
    },
    [Language.Portuguese]: {
      displayName: t('language.portuguese'),
      originName: t('language.portuguese', { lng: getLocale(Language.Portuguese) }),
      loggingName: 'Portuguese',
      locale: getLocale(Language.Portuguese),
    },
    [Language.Romanian]: {
      displayName: t('language.romanian'),
      originName: t('language.romanian', { lng: getLocale(Language.Romanian) }),
      loggingName: 'Romanian',
      locale: getLocale(Language.Romanian),
    },
    [Language.Russian]: {
      displayName: t('language.russian'),
      originName: t('language.russian', { lng: getLocale(Language.Russian) }),
      loggingName: 'Russian',
      locale: getLocale(Language.Russian),
    },
    [Language.Serbian]: {
      displayName: t('language.serbian'),
      originName: t('language.serbian', { lng: getLocale(Language.Serbian) }),
      loggingName: 'Serbian',
      locale: getLocale(Language.Serbian),
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
    [Language.Swahili]: {
      displayName: t('language.swahili'),
      originName: t('language.swahili', { lng: getLocale(Language.Swahili) }),
      loggingName: 'Swahili',
      locale: getLocale(Language.Swahili),
    },
    [Language.Swedish]: {
      displayName: t('language.swedish'),
      originName: t('language.swedish', { lng: getLocale(Language.Swedish) }),
      loggingName: 'Swedish',
      locale: getLocale(Language.Swedish),
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

  return languageToLanguageInfo[language]
}

export function useLanguageInfo(language: Language): LanguageInfo {
  const { t } = useTranslation()
  return getLanguageInfo(t, language)
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
