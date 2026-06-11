import { useEffect, useMemo, useState } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import type { RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { getRaiseCurrencyAsCurrency } from '~/pages/Liquidity/CreateAuction/utils'

/**
 * Resolves the raise-token USD price once and holds it stable for the lifetime of the user's
 * selection of `raiseCurrency`. The live oracle ticks frequently; if we used its current value
 * for display, the user's "$100k USD" would visibly drift to "$99,990" after a single tick, even
 * though nothing they did has changed. Snapshotting on first resolution gives a single anchor
 * value that every USD↔raise conversion in the flow agrees on.
 *
 * Re-snapshots only when `raiseCurrency` changes — the relationship between the two tokens is
 * entirely different anyway, so any prior anchor is meaningless. Otherwise the snapshot persists.
 *
 * Returns `null` only during the brief initial window before the oracle has resolved for the
 * first time. Consumers fall back to raise-currency display in that case (existing pattern).
 */
export function useStableRaiseUsdPrice({
  raiseCurrency,
  chainId,
}: {
  raiseCurrency: RaiseCurrency
  chainId: UniverseChainId
}): number | null {
  const raiseCurrencyObj = useMemo(() => getRaiseCurrencyAsCurrency(raiseCurrency, chainId), [raiseCurrency, chainId])
  const { price: liveUsdPrice } = useUSDCPrice(raiseCurrencyObj)

  // Live price as a finite positive number, or null while loading / on error.
  const liveUsdPriceNum = useMemo(() => {
    if (!liveUsdPrice) {
      return null
    }
    try {
      const parsed = Number(liveUsdPrice.toSignificant(18))
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    } catch {
      return null
    }
  }, [liveUsdPrice])

  // The snapshot, keyed by `{raiseCurrency, chainId}` so callers can safely pass a fallback chainId
  // during initial render (before `committed` resolves) without "freezing" a wrong-chain price.
  // Storing the keys lets us detect a stale snapshot without an extra reset effect.
  const [snapshot, setSnapshot] = useState<{
    raiseCurrency: RaiseCurrency
    chainId: UniverseChainId
    value: number
  } | null>(null)

  const matchesCurrent = snapshot !== null && snapshot.raiseCurrency === raiseCurrency && snapshot.chainId === chainId

  useEffect(() => {
    if (liveUsdPriceNum !== null && !matchesCurrent) {
      setSnapshot({ raiseCurrency, chainId, value: liveUsdPriceNum })
    }
  }, [liveUsdPriceNum, raiseCurrency, chainId, matchesCurrent])

  if (snapshot === null || !matchesCurrent) {
    return null
  }
  return snapshot.value
}
