import { ONE_DAY_MS, ONE_HOUR_MS, ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

export function getDurationRemainingString(expirationTime: number): string {
  const { days, hours, minutes, seconds, isPast } = getDurationRemaining(expirationTime)

  let result: string
  if (days !== undefined) {
    result = `${days}d ${hours}h ${minutes}m` // don't include seconds for days
  } else if (hours !== undefined) {
    result = `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes !== undefined) {
    result = `${minutes}m ${seconds}s`
  } else {
    result = `${seconds}s`
  }

  return isPast ? `${result} ago` : result
}

export function getDurationRemaining(expirationTime: number): {
  seconds: number
  minutes?: number
  hours?: number
  days?: number
  isPast?: boolean
} {
  const timeLeft = expirationTime - Date.now()
  const isPast = timeLeft < 0
  const absTimeLeft = Math.abs(timeLeft)

  const seconds = Math.floor((absTimeLeft % ONE_MINUTE_MS) / ONE_SECOND_MS)
  if (absTimeLeft < ONE_MINUTE_MS) {
    return { seconds, isPast }
  }
  const minutes = Math.floor((absTimeLeft % ONE_HOUR_MS) / ONE_MINUTE_MS)
  if (absTimeLeft < ONE_HOUR_MS) {
    return { seconds, minutes, isPast }
  }
  const hours = Math.floor((absTimeLeft % ONE_DAY_MS) / ONE_HOUR_MS)
  if (absTimeLeft < ONE_DAY_MS) {
    return { seconds, minutes, hours, isPast }
  }
  const days = Math.floor(absTimeLeft / ONE_DAY_MS)
  return { seconds, minutes, hours, days, isPast }
}
