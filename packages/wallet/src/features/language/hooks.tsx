import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Language, Locale } from 'wallet/src/features/language/constants'
import { useAppSelector } from 'wallet/src/state'

export function useCurrentLanguage(): Language {
  const { currentLanguage } = useAppSelector((state) => state.languageSettings)
  return currentLanguage
}

export type LanguageInfo = {
  name: string
  originName: string // name of language in that language
  locale: Locale
}

export function useLanguageInfo(language: Language): LanguageInfo {
  const { t } = useTranslation()

  const languageToLanguageInfo = useMemo((): Record<Language, LanguageInfo> => {
    return {
      [Language.ChineseSimplified]: {
        name: t('Chinese, Simplified'),
        originName: t('Chinese, Simplified', { lng: Locale.ChineseChina }),
        locale: Locale.ChineseChina,
      },
      [Language.ChineseTraditional]: {
        name: t('Chinese, Traditional'),
        originName: t('Chinese, Traditional', { lng: Locale.ChineseTaiwan }),
        locale: Locale.ChineseTaiwan,
      },
      [Language.Dutch]: {
        name: t('Dutch'),
        originName: t('Dutch', { lng: Locale.DutchNetherlands }),
        locale: Locale.DutchNetherlands,
      },
      [Language.English]: {
        name: t('English'),
        originName: t('English', { lng: Locale.EnglishUnitedStates }),
        locale: Locale.EnglishUnitedStates,
      },
      [Language.French]: {
        name: t('French'),
        originName: t('French', { lng: Locale.FrenchFrance }),
        locale: Locale.FrenchFrance,
      },
      [Language.Hindi]: {
        name: t('Hindi'),
        originName: t('Hindi', { lng: Locale.HindiIndia }),
        locale: Locale.HindiIndia,
      },
      [Language.Indonesian]: {
        name: t('Indonesian'),
        originName: t('Indonesian', { lng: Locale.IndonesianIndonesia }),
        locale: Locale.IndonesianIndonesia,
      },
      [Language.Japanese]: {
        name: t('Japanese'),
        originName: t('Japanese', { lng: Locale.JapaneseJapan }),
        locale: Locale.JapaneseJapan,
      },
      [Language.Malay]: {
        name: t('Malay'),
        originName: t('Malay', { lng: Locale.MalayMalaysia }),
        locale: Locale.MalayMalaysia,
      },
      [Language.Portuguese]: {
        name: t('Portuguese'),
        originName: t('Portuguese', { lng: Locale.PortuguesePortugal }),
        locale: Locale.PortuguesePortugal,
      },
      [Language.Russian]: {
        name: t('Russian'),
        originName: t('Russian', { lng: Locale.RussianRussia }),
        locale: Locale.RussianRussia,
      },
      [Language.Spanish]: {
        name: t('Spanish'),
        originName: t('Spanish', { lng: Locale.SpanishSpain }),
        locale: Locale.SpanishSpain,
      },
      [Language.Thai]: {
        name: t('Thai'),
        originName: t('Thai', { lng: Locale.ThaiThailand }),
        locale: Locale.ThaiThailand,
      },
      [Language.Turkish]: {
        name: t('Turkish'),
        originName: t('Turkish', { lng: Locale.TurkishTurkey }),
        locale: Locale.TurkishTurkey,
      },
      [Language.Ukrainian]: {
        name: t('Ukrainian'),
        originName: t('Ukrainian', { lng: Locale.UkrainianUkraine }),
        locale: Locale.UkrainianUkraine,
      },
      [Language.Urdu]: {
        name: t('Urdu'),
        originName: t('Urdu', { lng: Locale.UrduPakistan }),
        locale: Locale.UrduPakistan,
      },
      [Language.Vietnamese]: {
        name: t('Vietnamese'),
        originName: t('Vietnamese', { lng: Locale.VietnameseVietnam }),
        locale: Locale.VietnameseVietnam,
      },
    }
  }, [t])

  return languageToLanguageInfo[language]
}

export function useCurrentLanguageInfo(): LanguageInfo {
  const currentLanguage = useCurrentLanguage()
  return useLanguageInfo(currentLanguage)
}
