import { NoDecimalsCurrency, TwoDecimalsCurrency } from 'utilities/src/format/localeBasedFormats'

const HALF_CENT = 0.005

const hasCents = (price: number): boolean => Math.abs(price - Math.round(price)) >= HALF_CENT

export function createPortfolioYAxisFormatters({ locale, currency }: { locale: string; currency: string }): {
  yAxisFormatter: (price: number) => string
  yAxisTickmarksFormatter: (prices: number[]) => string[]
} {
  const wholeFormatter = NoDecimalsCurrency.createFormat(locale, currency)
  const centsFormatter = TwoDecimalsCurrency.createFormat(locale, currency)

  return {
    yAxisFormatter: (price) => (hasCents(price) ? centsFormatter : wholeFormatter).format(price),
    yAxisTickmarksFormatter: (prices) => {
      const formatter = prices.some(hasCents) ? centsFormatter : wholeFormatter
      return prices.map((price) => formatter.format(price))
    },
  }
}
