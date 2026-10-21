import { useMemo } from 'react'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import { deriveMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import type { MarginMarket } from '~/constants/margin'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'

export interface MarginVenueAllowlist {
  // The pair's markets the user has NOT opted out of, in registry order. What the slider ceiling
  // maxes over.
  allowedMarkets: MarginMarket[]
  // The same set as the wire carries it: deduped and sorted. This is the quote request's `open.venues`.
  allowedVenues: MarginVenue[]
  // Exclusions that actually bite on THIS pair — the global preference may name venues the pair does
  // not offer, and counting those would overstate what the user turned off here.
  excludedCount: number
}

// The venue allowlist for one pair. Memoized because the derived array IS the quote's query key:
// both inputs are reference-stable (the registry's per-pair arrays come straight out of
// useMarginMarkets' memo, and the store's exclusions are shallow-compared), so this only produces a
// new allowlist when a venue actually enters or leaves it.
export function useMarginVenueAllowlist({ market }: { market: MarginMarket | undefined }): MarginVenueAllowlist {
  const excludedVenues = useMarginFormStore((s) => s.excludedVenues)
  const { getPairMarkets } = useMarginMarkets()
  const pairMarkets = getPairMarkets(
    market ? marginPairKey({ collateralToken: market.collateral.address, debtToken: market.debt.address }) : undefined,
  )

  return useMemo(() => {
    const excluded = new Set(excludedVenues)
    const allowedMarkets = pairMarkets.filter((pairMarket) => !excluded.has(pairMarket.venue))
    return {
      allowedMarkets,
      allowedVenues: deriveMarginVenues({
        pairVenues: pairMarkets.map((pairMarket) => pairMarket.venue),
        excludedVenues,
      }),
      excludedCount: pairMarkets.length - allowedMarkets.length,
    }
  }, [pairMarkets, excludedVenues])
}
