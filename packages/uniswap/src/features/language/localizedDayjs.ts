import dayjs, { Dayjs } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'

import 'dayjs/locale/en'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import 'dayjs/locale/id'
import 'dayjs/locale/ja'
import 'dayjs/locale/nl'
import 'dayjs/locale/pt'
import 'dayjs/locale/ru'
import 'dayjs/locale/tr'
import 'dayjs/locale/vi'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-tw'
import { Locale } from 'uniswap/src/features/language/constants'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'

dayjs.extend(localizedFormat)

export type DateFormat = 'l' | 'll' | 'LL'
export const FORMAT_DATE_SHORT: DateFormat = 'l' // M/D/YYYY e.g. 8/16/2018
export const FORMAT_DATE_MEDIUM: DateFormat = 'll' // MMM D, YYYY	e.g. Aug 16, 2018
export const FORMAT_DATE_LONG: DateFormat = 'LL' // MMMM D, YYYY	e.g. August 16, 2018
export const FORMAT_DATE_MONTH = 'MMMM' // January-December
export const FORMAT_DATE_MONTH_YEAR = 'MMMM YYYY'
export const FORMAT_DATE_MONTH_DAY = 'MMM D' // Jan-Dec 1-31

export type TimeFormat = 'LT' | 'LTS'
export const FORMAT_TIME_SHORT: TimeFormat = 'LT' // h:mm A	e.g. 8:02 PM
export const FORMAT_TIME_MEDIUM: TimeFormat = 'LTS' // h:mm:ss A e.g. 8:02:18 PM

export type DateTimeFormat = 'lll' | 'LLL' | 'llll' | 'LLLL'
export const FORMAT_DATE_TIME_SHORT = 'lll' // MMM D, YYYY h:mm A	e.g. Aug 16, 2018 8:02 PM
export const FORMAT_DATE_TIME_MEDIUM = 'LLL' // MMMM D, YYYY h:mm A	e.g. August 16, 2018 8:02 PM
export const FORMAT_DATE_TIME_LONG = 'llll' // ddd, MMM D, YYYY h:mm A e.g. Thu, Aug 16, 2018 8:02 PM
export const FORMAT_DATE_TIME_FULL = 'LLLL' // dddd, MMMM D, YYYY h:mm A e.g. Thursday, August 16, 2018 8:02 PM

export type LocalizedDayjs = typeof dayjs

// Supported ones found here https://github.com/iamkun/dayjs/tree/dev/src/locale
const mapLocaleToSupportedDayjsLocale: Record<Locale, string> = {
  [Locale.ChineseSimplified]: 'zh-cn',
  [Locale.ChineseTraditional]: 'zh-tw',
  [Locale.DutchNetherlands]: 'nl',
  [Locale.EnglishUnitedStates]: 'en-us',
  [Locale.FrenchFrance]: 'fr',
  [Locale.IndonesianIndonesia]: 'id',
  [Locale.JapaneseJapan]: 'ja',
  [Locale.KoreanKorea]: 'ko',
  [Locale.PortugueseBrazil]: 'pt-br',
  [Locale.PortuguesePortugal]: 'pt',
  [Locale.RussianRussia]: 'ru',
  [Locale.SpanishSpain]: 'es-es',
  [Locale.SpanishLatam]: 'es-mx',
  [Locale.SpanishArgentina]: 'es-mx',
  [Locale.SpanishBelize]: 'es-mx',
  [Locale.SpanishBolivia]: 'es-mx',
  [Locale.SpanishChile]: 'es-mx',
  [Locale.SpanishColombia]: 'es-mx',
  [Locale.SpanishCostaRica]: 'es-mx',
  [Locale.SpanishCuba]: 'es-mx',
  [Locale.SpanishDominicanRepublic]: 'es-mx',
  [Locale.SpanishEcuador]: 'es-mx',
  [Locale.SpanishElSalvador]: 'es-mx',
  [Locale.SpanishGuatemala]: 'es-mx',
  [Locale.SpanishHonduras]: 'es-mx',
  [Locale.SpanishMexico]: 'es-mx',
  [Locale.SpanishNicaragua]: 'es-mx',
  [Locale.SpanishPanama]: 'es-mx',
  [Locale.SpanishParaguay]: 'es-mx',
  [Locale.SpanishPeru]: 'es-mx',
  [Locale.SpanishPuertoRico]: 'es-mx',
  [Locale.SpanishUruguay]: 'es-mx',
  [Locale.SpanishVenezuela]: 'es-mx',
  [Locale.SpanishUnitedStates]: 'es-us',
  [Locale.TurkishTurkey]: 'tr',
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
