import ms from 'ms'
import { Expiry } from './types'

const DAY_SECS = ms('1d') / 1000

export function expiryToDeadlineSeconds(expiry: Expiry): number {
  switch (expiry) {
    case Expiry.Day:
      return DAY_SECS
    case Expiry.Week:
      return DAY_SECS * 7
    case Expiry.Month:
      return DAY_SECS * 30
    case Expiry.Year:
      return DAY_SECS * 365
  }
}
