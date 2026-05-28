export const BALANCE_PERCENT_DIFFERENCE_THRESHOLD = 2
export const ABSOLUTE_MINIMUM_BALANCE_USD = 10

/**
 * Compare difference between portfolio balance and chart endpoint balance.
 * Determine if it's within an acceptable percentage range.
 *
 * Returns true (match) if both values are below the absolute minimum floor,
 * preventing false positives on tiny portfolios where a few cents of spam would cross the threshold.
 */
export function checkBalanceDiffWithinRange({
  chartTotalBalanceUSD,
  portfolioTotalBalanceUSD,
}: {
  chartTotalBalanceUSD?: number
  portfolioTotalBalanceUSD?: number
}): boolean {
  if (portfolioTotalBalanceUSD === undefined || chartTotalBalanceUSD === undefined) {
    return false
  }

  if (chartTotalBalanceUSD === 0 && portfolioTotalBalanceUSD === 0) {
    return true
  }

  // For tiny portfolios, treat as a match to avoid false positives
  if (Math.max(chartTotalBalanceUSD, portfolioTotalBalanceUSD) < ABSOLUTE_MINIMUM_BALANCE_USD) {
    return true
  }

  const difference = portfolioTotalBalanceUSD - chartTotalBalanceUSD

  let percentDifference = 0
  if (portfolioTotalBalanceUSD !== 0) {
    percentDifference = (difference / portfolioTotalBalanceUSD) * 100
  } else if (chartTotalBalanceUSD !== 0) {
    percentDifference = (difference / chartTotalBalanceUSD) * 100
  }

  return Math.abs(percentDifference) < BALANCE_PERCENT_DIFFERENCE_THRESHOLD
}
