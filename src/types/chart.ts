/**
 * Formatted type for Candlestick charts
 */
export type PriceChartEntry = {
  time: number // unix timestamp
  open: number
  close: number
  high: number
  low: number
}
