import { DefaultPriceStrategy } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getClosestTick } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/getClosestTick'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'

// Price tolerance for detecting strategy matches (1%)
const PRICE_TOLERANCE = 0.01

// Calculate expected prices for a given strategy
export function calculateStrategyPrices({
  priceStrategy,
  currentPrice,
  liquidityData,
  defaultMinPrice,
  defaultMaxPrice,
}: {
  priceStrategy: DefaultPriceStrategy
  currentPrice: number
  liquidityData: ChartEntry[]
  defaultMinPrice?: number
  defaultMaxPrice?: number
}): { minPrice: number; maxPrice: number } {
  const { index } = getClosestTick(liquidityData, currentPrice)
  const nextTick = liquidityData[index + 1]
  const prevTick = liquidityData[index - 1]

  switch (priceStrategy) {
    case DefaultPriceStrategy.STABLE: {
      // For stable pairs, use ±3 ticks instead of percentage
      const minTickIndex = Math.max(0, index - 3)
      const maxTickIndex = Math.min(liquidityData.length - 1, index + 3)

      return {
        minPrice: liquidityData[minTickIndex].price0,
        maxPrice: liquidityData[maxTickIndex].price0,
      }
    }
    case DefaultPriceStrategy.WIDE:
      return {
        minPrice: currentPrice * 0.5,
        maxPrice: currentPrice * 2,
      }
    case DefaultPriceStrategy.ONE_SIDED_UPPER:
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!nextTick) {
        throw new Error('No next tick found')
      }

      return {
        minPrice: nextTick.price0,
        maxPrice: currentPrice * 2,
      }
    case DefaultPriceStrategy.ONE_SIDED_LOWER:
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!prevTick) {
        throw new Error('No previous tick found')
      }

      return {
        minPrice: currentPrice * 0.5,
        maxPrice: prevTick.price0,
      }
    case DefaultPriceStrategy.FULL_RANGE:
      return {
        minPrice: liquidityData[0]?.price0 ?? 0,
        maxPrice: liquidityData[liquidityData.length - 1]?.price0 ?? Infinity,
      }
    case DefaultPriceStrategy.CUSTOM:
      return { minPrice: defaultMinPrice ?? currentPrice, maxPrice: defaultMaxPrice ?? currentPrice }
    default:
      return { minPrice: currentPrice, maxPrice: currentPrice }
  }
}

// Detect which strategy matches the current min/max prices
export function detectPriceStrategy({
  minPrice,
  maxPrice,
  currentPrice,
  liquidityData,
}: {
  minPrice?: number
  maxPrice?: number
  currentPrice: number
  liquidityData: ChartEntry[]
}): DefaultPriceStrategy | undefined {
  if (!minPrice || !maxPrice) {
    return undefined
  }

  const priceStrategies = [
    DefaultPriceStrategy.STABLE,
    DefaultPriceStrategy.WIDE,
    DefaultPriceStrategy.ONE_SIDED_LOWER,
    DefaultPriceStrategy.ONE_SIDED_UPPER,
    DefaultPriceStrategy.FULL_RANGE,
  ]

  for (const priceStrategy of priceStrategies) {
    const expectedPrices = calculateStrategyPrices({ priceStrategy, currentPrice, liquidityData })

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (expectedPrices.minPrice === undefined || expectedPrices.maxPrice === undefined) {
      continue
    }

    const minDiff = Math.abs(minPrice - expectedPrices.minPrice) / expectedPrices.minPrice
    const maxDiff = Math.abs(maxPrice - expectedPrices.maxPrice) / expectedPrices.maxPrice

    if (minDiff <= PRICE_TOLERANCE && maxDiff <= PRICE_TOLERANCE) {
      return priceStrategy
    }
  }

  return undefined
}
