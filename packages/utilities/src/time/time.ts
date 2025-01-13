// TODO: use compile time macro
import dayjs from 'dayjs'

export const SECONDS_IN_MINUTE = 60
export const MINUTES_IN_HOUR = 60
export const HOURS_IN_DAY = 24

export const ONE_SECOND_MS = 1000
export const ONE_MINUTE_MS = SECONDS_IN_MINUTE * ONE_SECOND_MS
export const ONE_HOUR_MS = MINUTES_IN_HOUR * ONE_MINUTE_MS
export const ONE_DAY_MS = HOURS_IN_DAY * ONE_HOUR_MS

export function isStale(lastUpdated: number | null, staleTime: number): boolean {
  return !lastUpdated || Date.now() - lastUpdated > staleTime
}

export function currentTimeInSeconds(): number {
  return dayjs().unix() // in seconds
}

export function inXMinutesUnix(x: number): number {
  return dayjs().add(x, 'minute').unix()
}

export const formatRelativeTime = (date: Date | string | number): string => {
  const now = dayjs()
  const timestamp = dayjs(date)

  const inSeconds = now.diff(timestamp, 'second')
  const inMinutes = now.diff(timestamp, 'minute')
  const inHours = now.diff(timestamp, 'hour')
  const inDays = now.diff(timestamp, 'day')

  if (inHours >= 24) {
    return `${inDays} ${inDays === 1 ? 'day' : 'days'} ago`
  } else if (inMinutes >= 60) {
    return `${inHours} ${inHours === 1 ? 'hour' : 'hours'} ago`
  } else if (inSeconds >= 60) {
    return `${inMinutes} ${inMinutes === 1 ? 'minute' : 'minutes'} ago`
  } else {
    return `${inSeconds} ${inSeconds === 1 ? 'second' : 'seconds'} ago`
  }
}

export const formatDateTime = (date: Date | string | number): string => {
  return dayjs(date).format('yyyy-MM-DD HH:mm')
}
