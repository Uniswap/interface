import { CandlestickData } from 'lightweight-charts'
import { getFiatCurrencyCode } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { PricePoint } from '~/appGraphql/data/util'

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
 * Formats a y-axis price label, undoing the low-price scale factor applied to the chart data.
 * When `decimals` is set (low-variance / stablecoin fiat ranges) it forces that precision so the
 * gridlines don't all collapse to the same "$1.00" label.
 */
export function formatPriceAxisLabel({
  scaledPrice,
  scaleFactor,
  decimals,
  format,
  locale,
  yAxisFormatter,
  tokenFormatType,
}: {
  scaledPrice: number
  scaleFactor: number
  decimals: number | undefined
  format: ReturnType<typeof useLocalizationContext>
  locale: string
  yAxisFormatter?: (price: number) => string
  tokenFormatType?: NumberType
}): string {
  const price = scaledPrice / scaleFactor

  if (yAxisFormatter) {
    return yAxisFormatter(price)
  }
  if (tokenFormatType) {
    return format.formatNumberOrString({ value: price, type: tokenFormatType })
  }
  if (decimals !== undefined) {
    const { amount, currency } = format.convertFiatAmount(price)
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: getFiatCurrencyCode(currency),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)
  }
  return format.convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)
}
