import ms from 'ms.macro'

import { TokenPriceQuery$data } from './__generated__/TokenPriceQuery.graphql'
import { TimePeriod } from './TopTokenQuery'

const REFRESH_ALLOWANCE = {
  [TimePeriod.ALL]: ms`1 hour`,
  [TimePeriod.YEAR]: ms`1 hour`,
  [TimePeriod.MONTH]: ms`1 hour`,
  [TimePeriod.WEEK]: ms`100s`,
  [TimePeriod.DAY]: ms`60s`,
  [TimePeriod.HOUR]: ms`60s`,
}

type priceData = Record<TimePeriod, { timestamp: number; data: TokenPriceQuery$data }>

type TokenData = { prices: priceData; details: number[] }

class TokenAPICache {
  cache: Record<string, TokenData> = {}

  checkPriceHistory(address: string, time: TimePeriod) {
    const entry = this.cache[address].prices[time]

    if (entry) {
      if (Date.now() - entry.timestamp < REFRESH_ALLOWANCE[time]) {
        return entry
      }
    }
    return null
  }
}

export default new TokenAPICache()
