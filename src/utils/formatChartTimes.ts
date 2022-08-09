import { NumberValue } from 'd3'

const createTimeFormatter = (timestamp: NumberValue, locale: string, options: Intl.DateTimeFormatOptions) =>
  new Date(timestamp.valueOf() * 1000).toLocaleTimeString(locale, options)

export const hourFormatter = (locale: string) => (timestamp: NumberValue) =>
  createTimeFormatter(timestamp, locale, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })

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

export const monthYearFormatter = (locale: string) => (timestamp: NumberValue) =>
  createDateFormatter(timestamp, locale, {
    month: 'long',
    year: 'numeric',
  })

export const monthYearDayFormatter = (locale: string) => (timestamp: NumberValue) =>
  createDateFormatter(timestamp, locale, {
    month: 'short',
    year: 'numeric',
    day: 'numeric',
  })

export const monthFormatter = (locale: string) => (timestamp: NumberValue) =>
  createDateFormatter(timestamp, locale, { month: 'long' })

export const weekFormatter = (locale: string) => (timestamp: NumberValue) =>
  createDateFormatter(timestamp, locale, { weekday: 'long' })
