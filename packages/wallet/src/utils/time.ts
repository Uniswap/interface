// TODO: use compile time macro
import dayjs from 'dayjs'

export const ONE_SECOND_MS = 1000
export const ONE_MINUTE_MS = 60 * ONE_SECOND_MS
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS
export const ONE_DAY_MS = 24 * ONE_HOUR_MS

export function isStale(lastUpdated: number | null, staleTime: number): boolean {
  return !lastUpdated || Date.now() - lastUpdated > staleTime
}

export function currentTimeInSeconds(): number {
  return dayjs().unix() // in seconds
}

export function inXMinutesUnix(x: number): number {
  return dayjs().add(x, 'minute').unix()
}
