import { plural, t } from '@lingui/macro'
import ms from 'ms'

import { roundAndPluralize } from './roundAndPluralize'

const SECOND = ms(`1s`)
const MINUTE = ms(`1m`)
const HOUR = ms(`1h`)
const DAY = ms(`1d`)
const WEEK = ms(`7d`)
const MONTH = ms(`30d`)

interface TimePeriod {
  milliseconds: number
  pluralLabel: (i: number) => string
}

const timePeriods: TimePeriod[] = [
  {
    milliseconds: MONTH,
    pluralLabel: (i: number) =>
      plural(i, {
        one: 'month',
        other: 'months',
      }),
  },
  {
    milliseconds: WEEK,
    pluralLabel: (i: number) =>
      plural(i, {
        one: 'week',
        other: 'weeks',
      }),
  },
  {
    milliseconds: DAY,
    pluralLabel: (i: number) =>
      plural(i, {
        one: 'day',
        other: 'days',
      }),
  },
  {
    milliseconds: HOUR,
    pluralLabel: (i: number) =>
      plural(i, {
        one: 'hour',
        other: 'hours',
      }),
  },
  {
    milliseconds: MINUTE,
    pluralLabel: (i: number) =>
      plural(i, {
        one: 'minute',
        other: 'minutes',
      }),
  },
  {
    milliseconds: SECOND,
    pluralLabel: (i: number) =>
      plural(i, {
        one: 'second',
        other: 'seconds',
      }),
  },
]

export function timeUntil(date: Date, originalDate?: Date): string | undefined {
  const referenceDate = originalDate ?? new Date()

  const milliseconds = date.getTime() - referenceDate.getTime()

  if (milliseconds < 0) return undefined

  const monthInterval = milliseconds / MONTH
  if (monthInterval >= 100) return `99+ ${t`months`}`

  for (const period of timePeriods) {
    const interval = milliseconds / period.milliseconds

    if (interval >= 1) {
      return `${Math.floor(interval)} ${period.pluralLabel(interval)}`
    }
  }
  return undefined
}

export const timeLeft = (targetDate: Date): string => {
  const countDown = new Date(targetDate).getTime() - new Date().getTime()
  const days = Math.floor(countDown / DAY)
  const hours = Math.floor((countDown % DAY) / HOUR)
  const minutes = Math.floor((countDown % HOUR) / MINUTE)

  return `${days !== 0 ? roundAndPluralize(days, 'day') : ''} ${
    hours !== 0 ? roundAndPluralize(hours, 'hour') : ''
  } ${roundAndPluralize(minutes, 'minute')}`
}
