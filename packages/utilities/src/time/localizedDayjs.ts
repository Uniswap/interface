import dayjs, { Dayjs } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { useTranslation } from 'react-i18next'

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

/**
 * Utility hook to ensure that the date formatted by dayjs is up to date with the current locale
 * @returns dayjs instance for ease of use, same as instance imported from library
 */
export function useLocalizedDayjs(): LocalizedDayjs {
  const { i18n } = useTranslation()
  dayjs.locale(i18n.language)
  return dayjs
}

export function useFormattedDate(date: Dayjs, format: DateFormat): string {
  const { i18n } = useTranslation()
  return date.locale(i18n.language).format(format).toString()
}

export function useFormattedTime(date: Dayjs, format: TimeFormat): string {
  const { i18n } = useTranslation()
  return date.locale(i18n.language).format(format).toString()
}

export function useFormattedDateTime(date: Dayjs, format: DateTimeFormat): string {
  const { i18n } = useTranslation()
  return date.locale(i18n.language).format(format).toString()
}
