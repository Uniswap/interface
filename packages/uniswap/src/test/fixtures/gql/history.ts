import { GraphQLApi } from '@universe/api'
import { amount, timestampedAmount } from 'uniswap/src/test/fixtures/gql/amounts'
import { faker } from 'uniswap/src/test/shared'
import { createArray, createFixture, randomEnumValue } from 'uniswap/src/test/utils'
import { ONE_DAY_MS, ONE_HOUR_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

/**
 * Constants
 */
export const weekMs = 7 * ONE_DAY_MS
export const monthMs = 30 * ONE_DAY_MS
export const yearMs = 365 * ONE_DAY_MS

export const historyDurationsMs: Record<GraphQLApi.HistoryDuration, number> = {
  [GraphQLApi.HistoryDuration.FiveMinute]: ONE_MINUTE_MS * 5,
  [GraphQLApi.HistoryDuration.Hour]: ONE_HOUR_MS,
  [GraphQLApi.HistoryDuration.Day]: ONE_DAY_MS,
  [GraphQLApi.HistoryDuration.Week]: weekMs,
  [GraphQLApi.HistoryDuration.Month]: monthMs,
  [GraphQLApi.HistoryDuration.Year]: yearMs,
  [GraphQLApi.HistoryDuration.Max]: 5 * yearMs,
}

/**
 * Base fixtures
 */

type PriceHistoryOptions = {
  duration: GraphQLApi.HistoryDuration
  size: number
}

export const priceHistory = createFixture<GraphQLApi.TimestampedAmount[], PriceHistoryOptions>(() => ({
  duration: randomEnumValue(GraphQLApi.HistoryDuration),
  size: faker.datatype.number({ min: 10, max: 20 }),
}))(({ size, duration }) => {
  const durationMs = historyDurationsMs[duration]
  const endDate = durationMs + faker.date.past().getMilliseconds()
  const startDate = endDate - durationMs

  return createArray(size, (i) =>
    timestampedAmount({
      // Timestamp in seconds
      timestamp: Math.floor((startDate + (endDate - startDate) * (i / size)) / 1000),
    }),
  ) as GraphQLApi.TimestampedAmount[] // Simplify type
})

/**
 * Helper functions
 */

export const getLatestPrice = (history: Maybe<GraphQLApi.TimestampedAmount>[]): GraphQLApi.Amount => {
  const filteredHistory = history.filter((item) => item !== null) as GraphQLApi.TimestampedAmount[]
  return amount({ value: filteredHistory[filteredHistory.length - 1]?.value ?? 0 })
}

export const get24hPriceChange = (history: Maybe<GraphQLApi.TimestampedAmount>[]): GraphQLApi.Amount => {
  const price = history[history.length - 1]?.value ?? 0
  const prevPrice = history[history.length - 2]?.value ?? 0
  const priceTimestamp = history[history.length - 1]?.timestamp ?? 0
  const prevPriceTimestamp = history[history.length - 2]?.timestamp ?? 0

  const timeDiff = priceTimestamp - prevPriceTimestamp
  const priceDiff = price - prevPrice

  const dayPriceDiff = timeDiff > 0 ? priceDiff * (ONE_DAY_MS / timeDiff) * 100 : 0

  return amount({ value: prevPrice > 0 ? dayPriceDiff / prevPrice : 0 })
}
