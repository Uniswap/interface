import { type ChartData } from 'src/components/charts/SparklineChart'
import { type PortfolioBalanceBreakdown } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'

export type BreakdownCategoryDisplay = { valueUSD: number | undefined; percentChange: number | undefined }

export type BreakdownCardProps = {
  tokens?: BreakdownCategoryDisplay
  pools?: BreakdownCategoryDisplay
  earn?: BreakdownCategoryDisplay
  // Color the percent green/red by sign — used while scrubbing for legibility; neutral at rest.
  semanticPercentColor: boolean
}

/** The scrubbed values at the crosshair, or all `undefined` when the chart is at rest. */
type ScrubValues = {
  total: number | undefined
  tokens: number | undefined
  pools: number | undefined
  earn: number | undefined
}

/**
 * Resolves the breakdown card's props, or `undefined` when the card should be hidden.
 *
 * Hidden unless an eligible category flag is on and there is a useful breakdown to show. At rest, rows use
 * wallet-balances values with period deltas from their chart series. While scrubbing, every row follows the crosshair.
 */
export function getBreakdownCardProps({
  poolsEnabled,
  earnEnabled,
  poolsUnavailable,
  breakdown,
  scrub,
  tokensData,
  poolsData,
  earnData,
  isAllTimePeriod,
}: {
  poolsEnabled: boolean
  earnEnabled: boolean
  poolsUnavailable: boolean
  breakdown: PortfolioBalanceBreakdown | undefined
  scrub: ScrubValues
  tokensData: ChartData
  poolsData: ChartData
  earnData: ChartData
  isAllTimePeriod: boolean
}): BreakdownCardProps | undefined {
  const hasTokenBalance = (breakdown?.tokens.balanceUSD ?? 0) > 0
  const hasPoolsBalance = poolsEnabled && !poolsUnavailable && (breakdown?.pools.balanceUSD ?? 0) > 0
  const hasEarnBalance = earnEnabled && (breakdown?.earn.balanceUSD ?? 0) > 0
  const shouldShowBreakdown = hasEarnBalance || (hasTokenBalance && hasPoolsBalance)

  if ((!poolsEnabled && !earnEnabled) || !breakdown || !shouldShowBreakdown) {
    return undefined
  }

  if (scrub.total === undefined) {
    // At rest, derive each category's percent from its chart series for the selected period
    // (matching the header), rather than the static 24h value from wallet balances.
    const periodPercentChange = (data: ChartData): number | undefined =>
      isAllTimePeriod ? undefined : getPortfolioChartPercentChange(data.map((point) => point.value))?.percentChange

    return {
      semanticPercentColor: false,
      tokens: hasTokenBalance
        ? { valueUSD: breakdown.tokens.balanceUSD, percentChange: periodPercentChange(tokensData) }
        : undefined,
      pools: hasPoolsBalance
        ? { valueUSD: breakdown.pools.balanceUSD, percentChange: periodPercentChange(poolsData) }
        : undefined,
      earn: hasEarnBalance
        ? {
            valueUSD: breakdown.earn.balanceUSD,
            percentChange: periodPercentChange(earnData),
          }
        : undefined,
    }
  }

  const scrubPercentChange = (first: number | undefined, scrubbed: number | undefined): number | undefined =>
    isAllTimePeriod || first === undefined || scrubbed === undefined
      ? undefined
      : getPortfolioChartPercentChange([first, scrubbed])?.percentChange

  return {
    semanticPercentColor: true,
    tokens: hasTokenBalance
      ? { valueUSD: scrub.tokens, percentChange: scrubPercentChange(tokensData[0]?.value, scrub.tokens) }
      : undefined,
    pools: hasPoolsBalance
      ? { valueUSD: scrub.pools, percentChange: scrubPercentChange(poolsData[0]?.value, scrub.pools) }
      : undefined,
    earn: hasEarnBalance
      ? {
          valueUSD: scrub.earn,
          percentChange: scrubPercentChange(earnData[0]?.value, scrub.earn),
        }
      : undefined,
  }
}
