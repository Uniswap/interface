import { PricePoint } from 'graphql/data/util'
import { CandlestickData } from 'lightweight-charts'

/**
 * Returns the minimum and maximum values in the given array of PricePoints.
 */
export function getPriceBounds(prices: PricePoint[]): { min: number; max: number } {
  if (!prices.length) return { min: 0, max: 0 }

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
  if (!data.length) return { min: 0, max: 0 }

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
