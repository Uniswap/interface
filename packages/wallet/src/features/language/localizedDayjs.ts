import dayjs, { Dayjs } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'

import 'dayjs/locale/en'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import 'dayjs/locale/hi'
import 'dayjs/locale/id'
import 'dayjs/locale/ja'
import 'dayjs/locale/ms-my'
import 'dayjs/locale/nl'
import 'dayjs/locale/pt'
import 'dayjs/locale/ru'
import 'dayjs/locale/th'
import 'dayjs/locale/tr'
import 'dayjs/locale/uk'
import 'dayjs/locale/ur'
import 'dayjs/locale/vi'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-tw'
import { Locale } from 'wallet/src/features/language/constants'
import { useCurrentLanguageInfo } from 'wallet/src/features/language/hooks'

dayjs.extend(localizedFormat)

export type DateFormat = 'l' | 'll' | 'LL'
export const FORMAT_DATE_SHORT: DateFormat = 'l'
export const FORMAT_DATE_MEDIUM: DateFormat = 'll'
export const FORMAT_DATE_LONG: DateFormat = 'LL'
export const FORMAT_DATE_MONTH = 'MMMM'
export const FORMAT_DATE_MONTH_YEAR = 'MMMM YYYY'
export const FORMAT_DATE_MONTH_DAY = 'MMM D'

export type TimeFormat = 'LT' | 'LTS'
export const FORMAT_TIME_SHORT: TimeFormat = 'LT'
export const FORMAT_TIME_MEDIUM: TimeFormat = 'LTS'

export type DateTimeFormat = 'lll' | 'LLL' | 'llll' | 'LLLL'
export const FORMAT_DATE_TIME_SHORT = 'lll'
export const FORMAT_DATE_TIME_MEDIUM = 'LLL'
export const FORMAT_DATE_TIME_LONG = 'llll'
export const FORMAT_DATE_TIME_FULL = 'LLLL'

export type LocalizedDayjs = typeof dayjs

// Supported ones found here https://github.com/iamkun/dayjs/tree/dev/src/locale
const mapLocaleToSupportedDayjsLocale: Record<Locale, string> = {
  [Locale.ChineseSimplified]: 'zh-cn',
  [Locale.ChineseTraditional]: 'zh-tw',
  [Locale.DutchNetherlands]: 'nl',
  [Locale.EnglishUnitedStates]: 'en-us',
  [Locale.FrenchFrance]: 'fr',
  [Locale.HindiIndia]: 'hi',
  [Locale.IndonesianIndonesia]: 'id',
  [Locale.JapaneseJapan]: 'ja',
  [Locale.MalayMalaysia]: 'ms',
  [Locale.PortuguesePortugal]: 'pt',
  [Locale.RussianRussia]: 'ru',
  [Locale.SpanishSpain]: 'es-es',
  [Locale.SpanishLatam]: 'es-mx',
  [Locale.SpanishUnitedStates]: 'es-us',
  [Locale.ThaiThailand]: 'th',
  [Locale.TurkishTurkey]: 'tr',
  [Locale.UkrainianUkraine]: 'uk',
  [Locale.UrduPakistan]: 'ur',
  [Locale.VietnameseVietnam]: 'vi',
}

/**
 * Utility hook to ensure that the date formatted by dayjs is up to date with the current locale.
 * Does not currently lead to rerender when language is changed, but this isn't needed when language is controlled
 * in system settings.s
 * @returns dayjs instance for ease of use, same as instance imported from library
 */
export function useLocalizedDayjs(): LocalizedDayjs {
  const { locale } = useCurrentLanguageInfo()
  dayjs.locale(mapLocaleToSupportedDayjsLocale[locale])
  return dayjs
}

export function useFormattedDate(date: Dayjs, format: DateFormat): string {
  const { locale } = useCurrentLanguageInfo()
  return date.locale(mapLocaleToSupportedDayjsLocale[locale]).format(format).toString()
}

export function useFormattedTime(date: Dayjs, format: TimeFormat): string {
  const { locale } = useCurrentLanguageInfo()
  return date.locale(mapLocaleToSupportedDayjsLocale[locale]).format(format).toString()
}

export function useFormattedDateTime(date: Dayjs, format: DateTimeFormat): string {
  const { locale } = useCurrentLanguageInfo()
  return date.locale(locale).format(format).toString()
}
