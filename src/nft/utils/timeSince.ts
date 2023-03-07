import { roundAndPluralize } from './roundAndPluralize'

export function timeSince(date: Date, min?: boolean) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  let interval = seconds / 31536000

  if (interval > 1) return roundAndPluralize(interval, min ? 'yr' : 'year')

  interval = seconds / 2592000
  if (interval > 1) return roundAndPluralize(interval, min ? 'mth' : 'month')

  interval = seconds / 86400
  if (interval > 1) return roundAndPluralize(interval, 'day')

  interval = seconds / 3600

  if (interval > 1) return roundAndPluralize(interval, min ? 'hr' : 'hour')

  interval = seconds / 60
  if (interval > 1) return roundAndPluralize(interval, 'min')

  return roundAndPluralize(interval, 'sec')
}

const MINUTE = 1000 * 60
const HOUR = MINUTE * 60
const DAY = 24 * HOUR

export const timeLeft = (targetDate: Date): string => {
  const countDown = new Date(targetDate).getTime() - new Date().getTime()
  const days = Math.floor(countDown / DAY)
  const hours = Math.floor((countDown % DAY) / HOUR)
  const minutes = Math.floor((countDown % HOUR) / MINUTE)

  return `${days !== 0 ? roundAndPluralize(days, 'day') : ''} ${
    hours !== 0 ? roundAndPluralize(hours, 'hour') : ''
  } ${roundAndPluralize(minutes, 'minute')}`
}
