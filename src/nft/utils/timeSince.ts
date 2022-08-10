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
