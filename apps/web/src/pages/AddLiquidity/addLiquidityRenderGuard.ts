import type { Currency } from '@uniswap/sdk-core'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PoolData } from '~/appGraphql/data/pools/usePoolData'

export type FlowState = 'browse' | 'form'

export type AddLiquidityRenderGuard = 'redirect' | 'loading' | 'ready'

/**
 * Decides whether to redirect, show a loader, or render the page based on the pool address, chain,
 * and how far token/pool resolution has progressed. Kept as a pure function (out of the component)
 * so the branching lives in one place and is unit-testable without the component's module graph.
 */
export function resolveAddLiquidityRenderGuard({
  poolAddress,
  chainIdFromUrl,
  flowState,
  poolLoading,
  poolData,
  urlToken0,
  urlToken1,
  currenciesLoading,
}: {
  poolAddress?: string
  chainIdFromUrl?: UniverseChainId
  flowState: FlowState
  poolLoading: boolean
  poolData?: PoolData
  urlToken0?: Currency
  urlToken1?: Currency
  currenciesLoading: boolean
}): AddLiquidityRenderGuard {
  if (!poolAddress) {
    return 'ready'
  }

  if (!chainIdFromUrl) {
    return 'redirect'
  }

  // Pool data finished loading, no pool resolved, and the URL has no tokens to fall back on.
  if (!poolLoading && !poolData && !urlToken0 && !urlToken1) {
    return 'redirect'
  }

  // Still loading and the URL carries no tokens for an immediate render.
  if (poolLoading && !urlToken0 && !urlToken1) {
    return 'loading'
  }

  // The position form builds a pool from a *complete* token pair. On direct/refresh loads the URL's
  // `currencyA=NATIVE` resolves instantly while a token `currencyB` loads async (and `poolData` may
  // still be in flight). Mounting the form mid-resolution freezes `currencyInputs` to the half-pair
  // and then syncs `currencyB=undefined` back to the URL — which renders a "Pool data error" and
  // makes the broken state stick across refreshes. Wait for a complete pair (from pool data or both
  // URL currencies) while anything is still resolving it.
  const hasCompleteTokenPair = Boolean(poolData) || Boolean(urlToken0 && urlToken1)
  if (flowState === 'form' && !hasCompleteTokenPair && (poolLoading || currenciesLoading)) {
    return 'loading'
  }

  return 'ready'
}
