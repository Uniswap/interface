import ms from 'ms.macro'

import { TimePeriod } from './TopTokenQuery'
import { PriceHistory } from './types'

/* TODO: Replace these times with non-arbitrary values */
export const PRICEHISTORY_REFRESH_ALLOWANCE = {
  [TimePeriod.ALL]: ms`1 hour`,
  [TimePeriod.YEAR]: ms`1 hour`,
  [TimePeriod.MONTH]: ms`1 hour`,
  [TimePeriod.WEEK]: ms`100s`,
  [TimePeriod.DAY]: ms`60s`,
  [TimePeriod.HOUR]: ms`60s`,
}

type PriceData = Record<TimePeriod, { timestamp: number; data: PriceHistory }>
type TokenData = { prices: PriceData }

class TokenAPICache {
  cache: Record<string, TokenData> = {}

  checkPriceHistory(address: string, time: TimePeriod) {
    const entry = this.cache[address]?.prices[time]

    if (entry && Date.now() - entry.timestamp < PRICEHISTORY_REFRESH_ALLOWANCE[time]) {
      return entry.data
    }
    return null
  }
  setPriceHistory(data: PriceHistory, address: string, time: TimePeriod) {
    const item = { timestamp: Date.now(), data }
    const entry = this.cache[address]
    if (entry) {
      entry.prices[time] = item
    } else {
      this.cache[address] = { prices: { [time]: item } as PriceData }
    }
  }
}

export default new TokenAPICache()
