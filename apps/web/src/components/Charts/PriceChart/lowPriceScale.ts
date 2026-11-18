import { getLowVarianceAxisDecimals } from 'uniswap/src/components/charts/utils'
import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import type { PriceChartData } from '~/utils/charts'

const LOW_PRICE_RANGE_THRESHOLD = 0.2
const LOW_PRICE_RANGE_SCALE_FACTOR = 1000000000

/**
 * Largest magnitude lightweight-charts accepts in a series point. Past it, `setData` fails an
 * internal assertion that throws from the chart's mount effect — there is no boundary between there
 * and the app shell, so one bad series blanks the whole page.
 */
export const MAX_PLOTTABLE_VALUE = Number.MAX_SAFE_INTEGER / 100

/**
 * The factor to multiply a series by before plotting. Lightweight-charts shows few price-axis points
 * for low-value/low-volatility tokens, so those are scaled up to earn more of them.
 *
 * A narrow range alone doesn't mean the values are small, though: a flat series of large numbers (a
 * steady FDV, a pegged price) passes the same test, and scaling those overflows what the chart can
 * plot. Such a series is left unscaled — it already gets plenty of axis points, which is all the
 * scaling was for.
 */
export function getLowPriceRangeScaleFactor({ min, max }: { min: number; max: number }): number {
  const largestMagnitude = Math.max(Math.abs(min), Math.abs(max))
  const fitsAfterScaling = largestMagnitude * LOW_PRICE_RANGE_SCALE_FACTOR <= MAX_PLOTTABLE_VALUE
  return max - min < LOW_PRICE_RANGE_THRESHOLD && fitsAfterScaling ? LOW_PRICE_RANGE_SCALE_FACTOR : 1
}

function applyPriceScaleFactor(data: PriceChartData, scaleFactor: number): PriceChartData {
  return {
    time: data.time,
    value: (data.value || data.close) * scaleFactor,
    open: data.open * scaleFactor,
    close: data.close * scaleFactor,
    high: data.high * scaleFactor,
    low: data.low * scaleFactor,
  }
}

/** A series as plotted: scaled up for low-value pairs (see getLowPriceRangeScaleFactor), with its bounds. */
export function getAdjustedPrices(data: PriceChartData[], disableLowPriceRangeScaling?: boolean) {
  let adjustedData = data
  let { min, max } = getCandlestickPriceBounds(data)

  // Derived from the original bounds — the axis formatter receives unscaled prices.
  const priceAxisDecimals = getLowVarianceAxisDecimals(min, max)

  const lowPriceRangeScaleFactor = disableLowPriceRangeScaling ? 1 : getLowPriceRangeScaleFactor({ min, max })
  if (lowPriceRangeScaleFactor !== 1) {
    adjustedData = data.map((point) => applyPriceScaleFactor(point, lowPriceRangeScaleFactor))
    min = min * lowPriceRangeScaleFactor
    max = max * lowPriceRangeScaleFactor
  }

  return { adjustedData, lowPriceRangeScaleFactor, min, max, priceAxisDecimals }
}
