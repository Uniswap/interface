import ms from 'ms'
import { LimitsExpiry } from 'uniswap/src/types/limits'

const DAY_SECS = ms('1d') / 1000

// eslint-disable-next-line consistent-return
export function expiryToDeadlineSeconds(expiry: LimitsExpiry): number {
  switch (expiry) {
    case LimitsExpiry.Day:
      return DAY_SECS
    case LimitsExpiry.Week:
      return DAY_SECS * 7
    case LimitsExpiry.Month:
      return DAY_SECS * 30
    case LimitsExpiry.Year:
      return DAY_SECS * 365
  }
}
