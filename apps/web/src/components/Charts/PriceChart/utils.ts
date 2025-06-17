import { PricePoint } from 'appGraphql/data/util'
import { PriceChartData } from 'components/Charts/PriceChart'
import { CandlestickData } from 'lightweight-charts'

/**
 * Returns the minimum and maximum values in the given array of PricePoints.
 */
export function getPriceBounds(prices: PricePoint[]): { min: number; max: number } {
  if (!prices.length) {
    return { min: 0, max: 0 }
  }

  let min = prices[0].value
  let max = prices[0].value

  for (const pricePoint of prices) {
    if (pricePoint.value < min) {
      min = pricePoint.value
    }
    if (pricePoint.value > max) {
      max = pricePoint.value
    }
  }

  return { min, max }
}

/**
 * Returns the minimum and maximum values in the given array of candlestick data.
 */
export function getCandlestickPriceBounds(data: CandlestickData[]): { min: number; max: number } {
  if (!data.length) {
    return { min: 0, max: 0 }
  }

  let min = data[0].low
  let max = data[0].high

  for (const dataPoint of data) {
    if (dataPoint.low < min) {
      min = dataPoint.low
    }
    if (dataPoint.high > max) {
      max = dataPoint.high
    }
  }

  return { min, max }
}

/**
 * Returns the currentPrice or the most recent price from the data array.
 */
export function getEffectivePrice({
  currentPrice,
  data,
}: {
  currentPrice: number | undefined
  data: PriceChartData[]
}): number {
  if (currentPrice) {
    return currentPrice
  }
  return data[data.length - 1]?.value ?? 0
}
