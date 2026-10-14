import type { Currency } from '@uniswap/sdk-core'

/**
 * Pure derivations behind the range chart's data states: which pool's history draws the price line,
 * and whether the chart can render, is still waiting, or has nothing to show. Kept out of
 * `D3LiquidityRangeInput` so they are testable without mounting the chart.
 */

/**
 * Whether a pool is *eligible* to draw its range against a sibling's price line rather than its own:
 * it either doesn't exist yet, or holds no liquidity at the current tick. Eligibility only — a pool
 * that passes here can still end up on its own series; `getPriceLineSource` makes that call.
 */
export function mayBorrowSiblingPriceLine({
  creatingPoolOrPair,
  poolHasNoActiveLiquidity,
}: {
  creatingPoolOrPair?: boolean
  poolHasNoActiveLiquidity?: boolean
}): boolean {
  return Boolean(creatingPoolOrPair) || Boolean(poolHasNoActiveLiquidity)
}

/**
 * Whether a pool actually ends up on a sibling's line: eligible, and holding nothing of its own to
 * draw. Both the source choice and the inputs-only fallback key on this, so they cannot drift.
 */
export function borrowsSiblingPriceLine({
  creatingPoolOrPair,
  poolHasNoActiveLiquidity,
  hasOwnPositions,
}: {
  creatingPoolOrPair?: boolean
  poolHasNoActiveLiquidity?: boolean
  hasOwnPositions: boolean
}): boolean {
  return mayBorrowSiblingPriceLine({ creatingPoolOrPair, poolHasNoActiveLiquidity }) && !hasOwnPositions
}

/**
 * Which pool's history draws the price line, and whether that choice is still settling.
 *
 * A pool holding positions of its own keeps its own series even when it has no active liquidity: no
 * active liquidity doesn't mean no trading — a swap can still push the price through an empty active
 * tick into positions parked further out — so that pool's history is real, and a borrowed one would
 * only be a proxy for it. Only a pool holding nothing has no series to show, and it is the one that
 * borrows, falling back to its own id when the pair has no sibling (all a pool that was emptied has
 * left).
 *
 * `hasOwnPositions` comes from the raw ticks, not the density chart's distribution: the distribution
 * is undefined whenever `computeSurroundingTicks` can't find a pivot, which is every pool whose
 * positions all sit on one side of the active tick — exactly the shape this branch exists for.
 *
 * The choice is withheld while it could still change, so a provisional id can't fire a query the real
 * one then discards. Once the pool's own ticks have arrived there is nothing left to wait for — the
 * answer is pinned, whatever the sibling lookup goes on to say. A pool being created skips the tick
 * fetch entirely, so its state must not gate this either.
 */
export function getPriceLineSource({
  creatingPoolOrPair,
  poolHasNoActiveLiquidity,
  poolId,
  siblingPoolId,
  siblingPoolLoading,
  hasOwnPositions,
  rawTicksLoading,
}: {
  creatingPoolOrPair?: boolean
  poolHasNoActiveLiquidity?: boolean
  poolId?: string
  siblingPoolId?: string
  siblingPoolLoading: boolean
  hasOwnPositions: boolean
  rawTicksLoading: boolean
}): { priceHistoryPoolId?: string; priceSourceLoading: boolean } {
  if (!borrowsSiblingPriceLine({ creatingPoolOrPair, poolHasNoActiveLiquidity, hasOwnPositions })) {
    return { priceHistoryPoolId: poolId, priceSourceLoading: false }
  }

  const priceSourceLoading = siblingPoolLoading || (!creatingPoolOrPair && rawTicksLoading)
  return {
    priceHistoryPoolId: priceSourceLoading ? undefined : (siblingPoolId ?? poolId),
    priceSourceLoading,
  }
}

/**
 * The `priceInverted` that orients another pool's series of the same pair to this chart's display, or
 * `undefined` when the two pools aren't the same pair on the same chain. Tokens are matched wrapped:
 * v4 sorts native ETH first while v2/v3 sort WETH by address, so the same pair can come back in the
 * opposite token order, and that pool's series then has to be read the other way round.
 */
export function getFallbackPriceInverted({
  fallbackCurrencies,
  sdkCurrencies,
  priceInverted,
}: {
  fallbackCurrencies: { currency0: Currency; currency1: Currency }
  sdkCurrencies: { TOKEN0: Maybe<Currency>; TOKEN1: Maybe<Currency> }
  priceInverted: boolean
}): boolean | undefined {
  const { TOKEN0, TOKEN1 } = sdkCurrencies
  if (!TOKEN0 || !TOKEN1) {
    return undefined
  }
  const fallback0 = fallbackCurrencies.currency0.wrapped
  const fallback1 = fallbackCurrencies.currency1.wrapped
  if (fallback0.equals(TOKEN0.wrapped) && fallback1.equals(TOKEN1.wrapped)) {
    return priceInverted
  }
  if (fallback0.equals(TOKEN1.wrapped) && fallback1.equals(TOKEN0.wrapped)) {
    return !priceInverted
  }
  return undefined
}

/**
 * Whether the price line comes from the fallback pool (in the migration flow, the position's source
 * pool) rather than from `getPriceLineSource`'s pick. Only a fallback series that has entries can take
 * over, and then whenever the pick has no line of its own: it borrows a sibling, which is a weaker
 * stand-in for this pair than the pool the liquidity is leaving, or its own series is empty.
 */
export function usesFallbackPriceLine({
  borrowsSibling,
  hasPickedHistory,
  hasFallbackHistory,
}: {
  borrowsSibling: boolean
  hasPickedHistory: boolean
  hasFallbackHistory: boolean
}): boolean {
  return hasFallbackHistory && (borrowsSibling || !hasPickedHistory)
}

/**
 * The price-strategy presets only need the current tick, so a pool with no chart data of its own
 * still gets them: when creating a new pool they render off the user-entered initial price, and for
 * an initialized pool with no liquidity off the pool's own tick. Neither waits for chart data.
 *
 * Note there is no empty-price condition here: while creating, this is unconditionally true. The
 * "no presets until a price is typed" behaviour comes from the parent, which only mounts
 * `D3LiquidityRangeInput` once `poolOrPair.tickCurrent` is defined (`RangeSelectionStep.tsx`).
 */
export function getPriceStrategiesState({
  creatingPoolOrPair,
  poolHasNoActiveLiquidity,
  showChartErrorView,
  poolOrPairLoading,
  chartLoading,
}: {
  creatingPoolOrPair?: boolean
  poolHasNoActiveLiquidity?: boolean
  showChartErrorView?: boolean
  poolOrPairLoading?: boolean
  chartLoading?: boolean
}): { showPriceStrategies: boolean; priceStrategiesLoading: boolean } {
  const presetsIndependentOfChart = mayBorrowSiblingPriceLine({ creatingPoolOrPair, poolHasNoActiveLiquidity })
  return {
    showPriceStrategies: presetsIndependentOfChart || !showChartErrorView,
    priceStrategiesLoading: Boolean(presetsIndependentOfChart ? poolOrPairLoading : chartLoading),
  }
}

/**
 * Whether the chart can render, is still waiting on data, or has nothing to show.
 *
 * A pool being created has no liquidity of its own and borrows a sibling pool's price line, so its
 * chart only waits on (and can only fail on) the sibling lookup. An initialized pool that holds no
 * active liquidity may instead have a series of its own, so what decides its fallback is whether the
 * source `getPriceLineSource` actually picked has a line. A pool with liquidity waits on its own
 * distribution and has nothing to show without one.
 *
 * `hasPriceData` counts the live-price point this component appends, so it is true even with no
 * history at all; `hasPriceHistory` is the fetched series alone and is what says whether there is a
 * line to draw. Neither means anything until the price line is known, which takes both of
 * `getPriceLineSource`'s `priceSourceLoading` (which pool's series to ask for) and
 * `priceQueryLoading` (that series arriving) — an unasked or in-flight series has no entries, and
 * reading that as "no line" would flash the inputs-only view on the way in. They are taken
 * separately rather than pre-mixed so a caller can't get the combination wrong.
 */
export function getChartDataState({
  creatingPoolOrPair,
  poolHasNoActiveLiquidity,
  internalChartError,
  poolOrPairLoading,
  priceSourceLoading,
  priceQueryLoading,
  hasPriceData,
  hasPriceHistory,
  hasSiblingPool,
  hasOwnPositions,
  liquidityDataLoading,
  rawTicksLoading,
  hasLiquidityData,
}: {
  creatingPoolOrPair?: boolean
  poolHasNoActiveLiquidity?: boolean
  internalChartError?: string
  poolOrPairLoading?: boolean
  priceSourceLoading: boolean
  priceQueryLoading: boolean
  hasPriceData: boolean
  hasPriceHistory: boolean
  hasSiblingPool: boolean
  hasOwnPositions: boolean
  liquidityDataLoading: boolean
  rawTicksLoading: boolean
  hasLiquidityData: boolean
}): { showChartErrorView: boolean; isLoading: boolean } {
  const priceDataLoading = priceSourceLoading || priceQueryLoading

  // `hasPriceHistory` is the series fetched from `getPriceLineSource`'s pick, so it speaks for the
  // chosen source. A sibling's mere existence stands in for that only when the sibling *is* the
  // source: a pool that borrows and finds an empty series still renders the lone live-price point,
  // which is long-standing behaviour and what keeps this in step with the create flow for a pair that
  // has no history anywhere. Once `hasOwnPositions` pins the line to this pool instead, the sibling
  // is never read and must not suppress the fallback for a pool that has no line at all.
  const missingPoolData = mayBorrowSiblingPriceLine({ creatingPoolOrPair, poolHasNoActiveLiquidity })
    ? !priceDataLoading &&
      !hasPriceHistory &&
      !(hasSiblingPool && borrowsSiblingPriceLine({ creatingPoolOrPair, poolHasNoActiveLiquidity, hasOwnPositions }))
    : !liquidityDataLoading && !hasLiquidityData
  const showChartErrorView =
    !!internalChartError || (!poolOrPairLoading && !priceDataLoading && !hasPriceData) || missingPoolData

  // Only the pool's own fetches gate here, and only when it has them — they are skipped while
  // creating. The sibling lookup reaches `isLoading` through `priceSourceLoading` instead: ORing it in
  // again would blank an already-rendered chart every time the lookup unskips for a pool whose source
  // is already pinned to itself (a poll flipping active liquidity to zero does exactly that).
  const poolDataLoading = !creatingPoolOrPair && (liquidityDataLoading || rawTicksLoading)
  const isLoading = Boolean(poolOrPairLoading || priceDataLoading || poolDataLoading)

  return { showChartErrorView, isLoading }
}
