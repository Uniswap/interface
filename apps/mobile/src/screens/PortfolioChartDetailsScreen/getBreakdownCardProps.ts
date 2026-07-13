import { type ChartData } from 'src/components/home/PortfolioChart/SparklineChart'
import { type PortfolioBalanceBreakdown } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'

export type BreakdownCategoryDisplay = { valueUSD: number | undefined; percentChange: number | undefined }

export type BreakdownCardProps = {
  tokens: BreakdownCategoryDisplay
  pools: BreakdownCategoryDisplay
  // Color the percent green/red by sign — used while scrubbing for legibility; neutral at rest.
  semanticPercentColor: boolean
}

/** The scrubbed values at the crosshair, or all `undefined` when the chart is at rest. */
type ScrubValues = { total: number | undefined; tokens: number | undefined; pools: number | undefined }

/**
 * Resolves the breakdown card's props, or `undefined` when the card should be hidden.
 *
 * Hidden unless the flag is on, pools are available, and both categories currently hold a non-zero
 * balance (a zero side would just be a "$0.00" row). At rest the rows show the wallet-balances value
 * with a period delta (first-to-last of the chart series) and neutral percent; while scrubbing they
 * show the chart-series value at the crosshair with a period-start delta and semantic color.
 */
export function getBreakdownCardProps({
  enabled,
  poolsUnavailable,
  breakdown,
  scrub,
  tokensData,
  poolsData,
  isAllTimePeriod,
}: {
  enabled: boolean
  poolsUnavailable: boolean
  breakdown: PortfolioBalanceBreakdown | undefined
  scrub: ScrubValues
  tokensData: ChartData
  poolsData: ChartData
  isAllTimePeriod: boolean
}): BreakdownCardProps | undefined {
  const hasBothCategoryBalances = (breakdown?.tokens.balanceUSD ?? 0) > 0 && (breakdown?.pools.balanceUSD ?? 0) > 0

  if (!enabled || poolsUnavailable || !breakdown || !hasBothCategoryBalances) {
    return undefined
  }

  if (scrub.total === undefined) {
    // At rest, derive each category's percent from its chart series for the selected period
    // (matching the header), rather than the static 24h value from wallet balances.
    const periodPercentChange = (data: ChartData): number | undefined =>
      isAllTimePeriod ? undefined : getPortfolioChartPercentChange(data.map((point) => point.value))?.percentChange

    return {
      semanticPercentColor: false,
      tokens: { valueUSD: breakdown.tokens.balanceUSD, percentChange: periodPercentChange(tokensData) },
      pools: { valueUSD: breakdown.pools.balanceUSD, percentChange: periodPercentChange(poolsData) },
    }
  }

  const scrubPercentChange = (first: number | undefined, scrubbed: number | undefined): number | undefined =>
    isAllTimePeriod || first === undefined || scrubbed === undefined
      ? undefined
      : getPortfolioChartPercentChange([first, scrubbed])?.percentChange

  return {
    semanticPercentColor: true,
    tokens: { valueUSD: scrub.tokens, percentChange: scrubPercentChange(tokensData[0]?.value, scrub.tokens) },
    pools: { valueUSD: scrub.pools, percentChange: scrubPercentChange(poolsData[0]?.value, scrub.pools) },
  }
}
