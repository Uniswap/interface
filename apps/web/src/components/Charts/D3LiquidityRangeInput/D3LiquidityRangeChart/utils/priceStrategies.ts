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
}: {
  priceStrategy: DefaultPriceStrategy
  currentPrice: number
  liquidityData: ChartEntry[]
}): { minPrice: number; maxPrice: number } {
  const { index } = getClosestTick(liquidityData, currentPrice)
  const nextTick = liquidityData[index + 1]
  const prevTick = liquidityData[index - 1]

  switch (priceStrategy) {
    case DefaultPriceStrategy.STABLE:
      return {
        minPrice: currentPrice * 0.99,
        maxPrice: currentPrice * 1.01,
      }
    case DefaultPriceStrategy.WIDE:
      return {
        minPrice: currentPrice * 0.9,
        maxPrice: currentPrice * 1.1,
      }
    case DefaultPriceStrategy.ONE_SIDED_UPPER:
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!nextTick) {
        throw new Error('No next tick found')
      }

      return {
        minPrice: nextTick.price0,
        maxPrice: currentPrice * 1.1,
      }
    case DefaultPriceStrategy.ONE_SIDED_LOWER:
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!prevTick) {
        throw new Error('No previous tick found')
      }

      return {
        minPrice: currentPrice * 0.9,
        maxPrice: prevTick.price0,
      }
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
