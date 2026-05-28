/**
 * Computes period-aware percent change from portfolio chart data.
 *
 * Shared between web and mobile so both platforms show the same number
 * for a given chart period.
 */

/**
 * Given an ordered array of chart values, return the percent change between
 * the first and last value, plus the corresponding absolute USD change.
 *
 * Returns `undefined` when the data is too short to compute a delta.
 */
export function getPortfolioChartPercentChange(values: number[]):
  | {
      percentChange: number
      absoluteChangeUSD: number
    }
  | undefined {
  if (values.length < 2) {
    return undefined
  }

  const startValue = values[0]
  const endValue = values[values.length - 1]

  if (startValue === undefined || endValue === undefined) {
    return undefined
  }

  if (startValue === 0) {
    return undefined
  }

  const delta = (endValue / startValue - 1) * 100
  if (!Number.isFinite(delta)) {
    return undefined
  }

  return {
    percentChange: delta,
    absoluteChangeUSD: endValue - startValue,
  }
}
