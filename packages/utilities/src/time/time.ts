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

  let inSeconds = now.diff(timestamp, 'second')
  let inMinutes = now.diff(timestamp, 'minute')
  let inHours = now.diff(timestamp, 'hour')
  let inDays = now.diff(timestamp, 'day')

  if (inSeconds > 0) {
    if (inHours >= 24) {
      return `${inDays} ${inDays === 1 ? 'day' : 'days'} ago`
    } else if (inMinutes >= 60) {
      return `${inHours} ${inHours === 1 ? 'hour' : 'hours'} ago`
    } else if (inSeconds >= 60) {
      return `${inMinutes} ${inMinutes === 1 ? 'minute' : 'minutes'} ago`
    } else {
      return `${inSeconds} ${inSeconds === 1 ? 'second' : 'seconds'} ago`
    }
  } else {
    inSeconds = -inSeconds
    inMinutes = -inMinutes
    inHours = -inHours
    inDays = -inDays
    if (inHours >= 24) {
      return `in ${inDays} ${inDays === 1 ? 'day' : 'days'}`
    } else if (inMinutes >= 60) {
      return `in ${inHours} ${inHours === 1 ? 'hour' : 'hours'}`
    } else if (inSeconds >= 60) {
      return `in ${inMinutes} ${inMinutes === 1 ? 'minute' : 'minutes'}`
    } else {
      return `in ${inSeconds} ${inSeconds === 1 ? 'second' : 'seconds'}`
    }
  }
}

export function formatRemainingTime(input: Date | string): string {
  const now = new Date()
  const endDate = new Date(input)
  const timeDiff = endDate.getTime() - now.getTime()

  if (timeDiff <= 0) {
    return 'Ended'
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

  if (days > 0) {
    return `in ${days} days ${hours} hours`
  }
  if (hours > 0) {
    return `in ${hours} hours ${minutes} minutes`
  }
  if (minutes > 0) {
    return `in ${minutes} minutes ${seconds} seconds`
  }
  return `in ${seconds} seconds`
}

export const formatDateTime = (date: Date | string | number): string => {
  return dayjs(date).format('yyyy-MM-DD HH:mm')
}
