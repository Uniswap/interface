/**
 * Compare difference between portfolio balance and chart endpoint balance. Determine if it's within an acceptable percentage range.
 */
export function checkBalanceDiffWithinRange({
  chartTotalBalanceUSD,
  portfolioTotalBalanceUSD,
  percentDifferenceThreshold,
}: {
  chartTotalBalanceUSD?: number
  portfolioTotalBalanceUSD?: number
  percentDifferenceThreshold: number
}): boolean {
  // Compare the two balances
  if (portfolioTotalBalanceUSD === undefined || chartTotalBalanceUSD === undefined) {
    return false
  }
  const difference = portfolioTotalBalanceUSD - chartTotalBalanceUSD

  if (chartTotalBalanceUSD === 0 && portfolioTotalBalanceUSD === 0) {
    return true
  }

  let percentDifference = 0
  if (portfolioTotalBalanceUSD !== 0) {
    percentDifference = (difference / portfolioTotalBalanceUSD) * 100
  } else if (chartTotalBalanceUSD !== 0) {
    percentDifference = (difference / chartTotalBalanceUSD) * 100
  }
  return Math.abs(percentDifference) < percentDifferenceThreshold
}
