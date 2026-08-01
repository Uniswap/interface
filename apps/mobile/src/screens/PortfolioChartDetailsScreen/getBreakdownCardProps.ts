import { type ChartData } from 'src/components/home/PortfolioChart/SparklineChart'
import { type PortfolioBalanceBreakdown } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
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
type ScrubValues = { total: number | undefined; tokens: number | undefined; pools: number | undefined }

/**
 * Resolves the breakdown card's props, or `undefined` when the card should be hidden.
 *
 * Hidden unless the flag is on and there is a useful breakdown to show. At rest, token/pool rows use
 * wallet-balances values with period deltas from chart series; Earn has no mobile chart series yet,
 * so it uses the wallet-balances delta. While scrubbing, token/pool rows follow the crosshair.
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
  const hasTokenBalance = (breakdown?.tokens.balanceUSD ?? 0) > 0
  const hasPoolsBalance = !poolsUnavailable && (breakdown?.pools.balanceUSD ?? 0) > 0
  const hasEarnBalance = (breakdown?.earn.balanceUSD ?? 0) > 0
  const shouldShowBreakdown = hasEarnBalance || (hasTokenBalance && hasPoolsBalance)

  if (!enabled || !breakdown || !shouldShowBreakdown) {
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
            percentChange: isAllTimePeriod ? undefined : breakdown.earn.percentChange,
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
          valueUSD: breakdown.earn.balanceUSD,
          percentChange: isAllTimePeriod ? undefined : breakdown.earn.percentChange,
        }
      : undefined,
  }
}
