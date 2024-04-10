import {
  Amount,
  HistoryDuration,
  TimestampedAmount,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { amount, timestampedAmount } from 'wallet/src/test/fixtures/gql/amounts'
import { faker } from 'wallet/src/test/shared'
import { createArray, createFixture, randomEnumValue } from 'wallet/src/test/utils'

/**
 * Constants
 */

export const hourMs = 60 * 60 * 1000
export const dayMs = 24 * hourMs
export const weekMs = 7 * dayMs
export const monthMs = 30 * dayMs
export const yearMs = 365 * dayMs

export const historyDurationsMs: Record<HistoryDuration, number> = {
  [HistoryDuration.Hour]: hourMs,
  [HistoryDuration.Day]: dayMs,
  [HistoryDuration.Week]: weekMs,
  [HistoryDuration.Month]: monthMs,
  [HistoryDuration.Year]: yearMs,
  [HistoryDuration.Max]: 5 * yearMs,
}

/**
 * Base fixtures
 */

type PriceHistoryOptions = {
  duration: HistoryDuration
  size: number
}

export const priceHistory = createFixture<TimestampedAmount[], PriceHistoryOptions>(() => ({
  duration: randomEnumValue(HistoryDuration),
  size: faker.datatype.number({ min: 10, max: 20 }),
}))(({ size, duration }) => {
  const durationMs = historyDurationsMs[duration]
  const endDate = durationMs + faker.date.past().getMilliseconds()
  const startDate = endDate - durationMs

  return createArray(size, (i) =>
    timestampedAmount({
      // Timestamp in seconds
      timestamp: Math.floor((startDate + (endDate - startDate) * (i / size)) / 1000),
    })
  ) as TimestampedAmount[] // Simplify type
})

/**
 * Helper functions
 */

export const getLatestPrice = (history: Maybe<TimestampedAmount>[]): Amount => {
  const filteredHistory = history.filter((item) => item !== null) as TimestampedAmount[]
  return amount({ value: filteredHistory[filteredHistory.length - 1]?.value ?? 0 })
}

export const get24hPriceChange = (history: Maybe<TimestampedAmount>[]): Amount => {
  const price = history[history.length - 1]?.value ?? 0
  const prevPrice = history[history.length - 2]?.value ?? 0
  const priceTimestamp = history[history.length - 1]?.timestamp ?? 0
  const prevPriceTimestamp = history[history.length - 2]?.timestamp ?? 0

  const timeDiff = priceTimestamp - prevPriceTimestamp
  const priceDiff = price - prevPrice

  const dayPriceDiff = timeDiff > 0 ? priceDiff * (dayMs / timeDiff) * 100 : 0

  return amount({ value: prevPrice > 0 ? dayPriceDiff / prevPrice : 0 })
}
