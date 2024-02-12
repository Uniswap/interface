import { faker } from '@faker-js/faker'
import {
  Chain,
  Currency,
  HistoryDuration,
  PriceSource,
  SafetyLevel,
  TimestampedAmount,
  Token,
  TokenMarket,
  TokenProject,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { dayMs, historyDurationMs } from 'wallet/src/test/fixtures'
import { EthToken } from 'wallet/src/test/gqlFixtures'

export const mockTokenPriceHistory = (
  duration: HistoryDuration,
  size = 10
): TimestampedAmount[] => {
  const durationMs = historyDurationMs[duration]
  const endDate = durationMs + faker.date.past().getMilliseconds()
  const startDate = endDate - durationMs

  const result: TimestampedAmount[] = []

  for (let i = 0; i < size; i++) {
    // Timestamp in seconds
    const timestamp = Math.floor((startDate + (endDate - startDate) * (i / size)) / 1000)

    result.push({
      id: faker.datatype.uuid(),
      timestamp,
      value: faker.datatype.float({ min: 0, max: 1000, precision: 0.01 }),
    })
  }

  return result
}

export const mockTokenMarket = (token: Token, priceHistory: TimestampedAmount[]): TokenMarket => {
  // Calculate price change for the last 24h
  const price = priceHistory[priceHistory.length - 1]?.value ?? 0
  const prevPrice = priceHistory[priceHistory.length - 2]?.value ?? 0
  const priceTimestamp = priceHistory[priceHistory.length - 1]?.timestamp ?? 0
  const prevPriceTimestamp = priceHistory[priceHistory.length - 2]?.timestamp ?? 0

  const timeDiff = priceTimestamp - prevPriceTimestamp
  const priceDiff = price - prevPrice

  const dayPriceDiff = timeDiff > 0 ? priceDiff * (dayMs / timeDiff) * 100 : 0
  const percentChange24h = prevPrice > 0 ? dayPriceDiff / prevPrice : 0

  return {
    id: faker.datatype.uuid(),
    priceHistory,
    price: {
      id: faker.datatype.uuid(),
      value: price,
    },
    pricePercentChange: {
      id: faker.datatype.uuid(),
      value: percentChange24h,
    },
    priceSource: PriceSource.SubgraphV3,
    token,
  }
}

export const mockTokenProject = (priceHistory: TimestampedAmount[]): TokenProject => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __typename, pricePercentChange, ...market } = mockTokenMarket(EthToken, priceHistory)

  return {
    id: faker.datatype.uuid(),
    description: faker.lorem.sentence(),
    logoUrl: faker.image.imageUrl(),
    name: faker.lorem.word(),
    safetyLevel: SafetyLevel.Verified,
    tokens: [
      {
        id: faker.datatype.uuid(),
        address: faker.finance.ethereumAddress(),
        chain: Chain.Ethereum,
        decimals: 6,
        symbol: faker.lorem.word(),
        market,
      },
      {
        id: faker.datatype.uuid(),
        address: faker.finance.ethereumAddress(),
        chain: Chain.Arbitrum,
        decimals: 6,
        symbol: faker.lorem.word(),
      },
      {
        id: faker.datatype.uuid(),
        address: faker.finance.ethereumAddress(),
        chain: Chain.Optimism,
        decimals: 6,
        symbol: faker.lorem.word(),
      },
      {
        id: faker.datatype.uuid(),
        address: faker.finance.ethereumAddress(),
        chain: Chain.Polygon,
        decimals: 6,
        symbol: faker.lorem.word(),
      },
    ],
    markets: [
      {
        ...market,
        currency: Currency.Eth,
        tokenProject: { id: faker.datatype.uuid(), tokens: [] },
        pricePercentChange24h: pricePercentChange,
      },
    ],
  }
}
