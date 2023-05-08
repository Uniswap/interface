import { plural, t } from '@lingui/macro'

import { roundAndPluralize } from './roundAndPluralize'

const MINUTE = 1000 * 60
const HOUR = MINUTE * 60
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY

export function timeUntil(date: Date): string | undefined {
  const seconds = Math.floor((date.getTime() - new Date().getTime()) / 1000)
  if (seconds < 0) return undefined

  let interval = seconds / MONTH
  if (interval >= 100) return `99+ ${t`months`}`
  if (interval > 1)
    return `${Math.floor(interval)} ${plural(interval, {
      one: 'month',
      other: 'months',
    })}`

  interval = seconds / WEEK
  if (interval > 1)
    return `${Math.floor(interval)} ${plural(interval, {
      one: 'week',
      other: 'weeks',
    })}`

  interval = seconds / DAY
  if (interval > 1)
    return `${Math.floor(interval)} ${plural(interval, {
      one: 'day',
      other: 'days',
    })}`

  interval = seconds / HOUR

  if (interval > 1)
    return `${Math.floor(interval)} ${plural(interval, {
      one: 'hour',
      other: 'hours',
    })}`

  interval = seconds / MINUTE
  if (interval > 1)
    return `${Math.floor(interval)} ${plural(interval, {
      one: 'minute',
      other: 'minutes',
    })}`

  return `${Math.floor(interval)} ${plural(interval, {
    one: 'second',
    other: 'seconds',
  })}`
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
