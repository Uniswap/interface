import { NumberValue } from 'd3'

const createTimeFormatter = (timestamp: NumberValue, locale: string, options: Intl.DateTimeFormatOptions) =>
  new Date(timestamp.valueOf() * 1000).toLocaleTimeString(locale, options)

export const hourFormatter = (locale: string) => (timestamp: NumberValue) =>
  createTimeFormatter(timestamp, locale, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })

const HOUR_FORMAT_OPTIONS = { hour: 'numeric', minute: 'numeric', hour12: true }
const DAY_AND_HOUR_FORMAT_OPTIONS = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }
const MONTH_AND_DAY_FORMAT_OPTIONS = { month: 'long', day: 'numeric' }
const MONTH_YEAR_DAY_FORMAT_OPTIONS = { month: 'short', year: 'numeric', day: 'numeric' }
const MONTH_TICK_FORMAT_OPTIONS = { month: 'long' }
const WEEK_FORMAT_OPTIONS = { weekday: 'long' }

export const dayHourFormatter = (locale: string) => (timestamp: NumberValue) =>
  createTimeFormatter(timestamp, locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

const createDateFormatter = (timestamp: NumberValue, locale: string, options: Intl.DateTimeFormatOptions) =>
  new Date(timestamp.valueOf() * 1000).toLocaleDateString(locale, options)

export const monthDayFormatter = (locale: string) => (timestamp: NumberValue) =>
  createDateFormatter(timestamp, locale, {
    month: 'long',
    day: 'numeric',
  })

export const monthYearDayFormatter = (locale: string) => (timestamp: NumberValue) =>
  createDateFormatter(timestamp, locale, {
    month: 'short',
    year: 'numeric',
    day: 'numeric',
  })

// TODO(now) implement
export const monthTickFormatter = (locale: string) => (timestamp: NumberValue) => {
  let date = new Date(timestamp.valueOf() * 1000)

  // when a tick maps to a date not on the first of the month, modify the tick to the closest
  // first of month date. For example, Dec 31 becomes Jan 1, and Dec 5 becomes Dec 1.
  if (date.getDate() !== 1) {
    date =
      date.getDate() >= 15
        ? new Date(date.getFullYear(), date.getMonth() + 1, 1)
        : new Date(date.getFullYear(), date.getMonth(), 1)
  }
  return date.toLocaleDateString(locale, { month: 'long' })
}

export const weekFormatter = (locale: string) => (timestamp: NumberValue) =>
  createDateFormatter(timestamp, locale, { weekday: 'long' })
