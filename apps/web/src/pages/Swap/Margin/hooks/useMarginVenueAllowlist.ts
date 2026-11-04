import { FetchError } from '@universe/api'
import { useEffect, useMemo } from 'react'
import type { MarginErrorCode } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import { deriveMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import type { MarginMarket } from '~/constants/margin'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { marginErrorCode } from '~/pages/Swap/Margin/marginQuoteError'

export interface MarginVenueAllowlist {
  // The pair's markets the user has NOT opted out of, in registry order — or only the pinned venue's
  // market while a pin applies. What the slider ceiling maxes over.
  allowedMarkets: MarginMarket[]
  // The same set as the wire carries it: deduped and sorted. This is the quote request's `open.venues`.
  allowedVenues: MarginVenue[]
  // Exclusions that actually bite on THIS pair — the global preference may name venues the pair does
  // not offer, and counting those would overstate what the user turned off here.
  excludedCount: number
}

// The venue allowlist for one pair. Memoized because the derived array IS the quote's query key:
// every input is reference-stable (the registry's per-pair arrays come straight out of
// useMarginMarkets' memo, the store's exclusions are shallow-compared, and the pin is a string), so
// this only produces a new allowlist when a venue actually enters or leaves it.
export function useMarginVenueAllowlist({ market }: { market: MarginMarket | undefined }): MarginVenueAllowlist {
  const excludedVenues = useMarginFormStore((s) => s.excludedVenues)
  const pin = useMarginFormStore((s) => s.pinnedVenue)
  const { getPairMarkets } = useMarginMarkets()
  const pairKey = market
    ? marginPairKey({ collateralToken: market.collateral.address, debtToken: market.debt.address })
    : undefined
  const pairMarkets = getPairMarkets(pairKey)
  // A pin applies only on the pair it was picked on, and only while that venue is still allowed.
  const pinnedVenue = pin?.pairKey === pairKey ? pin?.venue : undefined

  return useMemo(() => {
    const excluded = new Set(excludedVenues)
    const unexcludedMarkets = pairMarkets.filter((pairMarket) => !excluded.has(pairMarket.venue))
    const pinnedMarkets = unexcludedMarkets.filter((pairMarket) => pairMarket.venue === pinnedVenue)
    const allowedMarkets = pinnedMarkets.length > 0 ? pinnedMarkets : unexcludedMarkets
    return {
      allowedMarkets,
      allowedVenues: deriveMarginVenues({
        pairVenues: allowedMarkets.map((pairMarket) => pairMarket.venue),
        excludedVenues,
      }),
      excludedCount: pairMarkets.length - unexcludedMarkets.length,
    }
  }, [pairMarkets, excludedVenues, pinnedVenue])
}

// The quote refusals that mean the allowed venues can't take this position — with a pin, the pinned venue
// alone: none of them configured (400), none serving the pair (422), none able to lend enough (422).
const VENUE_CANNOT_FILL_CODES: ReadonlySet<MarginErrorCode> = new Set<MarginErrorCode>([
  'MARGIN_MARKET_NOT_SUPPORTED',
  'MARGIN_NO_ELIGIBLE_VENUE',
  'MARGIN_INSUFFICIENT_BORROW_LIQUIDITY',
])

export function isMarginVenueCannotFillError(error: unknown): boolean {
  if (!(error instanceof FetchError)) {
    return false
  }
  const data = error.data as { errorCode?: unknown; detail?: unknown } | undefined
  const code = marginErrorCode({
    errorCode: typeof data?.errorCode === 'string' ? data.errorCode : undefined,
    detail: typeof data?.detail === 'string' ? data.detail : undefined,
  })
  // Widened for the lookup: a wire string is only a candidate code until the set says otherwise.
  const cannotFillCodes: ReadonlySet<string> = VENUE_CANNOT_FILL_CODES
  return code !== undefined && cannotFillCodes.has(code)
}

// The venue picker sits inside the receipt, which a failed quote unmounts: a pin the venue can't fill
// would otherwise leave the form no way back to Auto. Only that refusal, with no quote left on screen,
// clears it: react-query keeps `error` set after a failed background refetch while the last quote still
// shows, and a 5xx or network blip says nothing about the venue. A pin picked on another pair isn't
// routing this quote, so its error leaves that pin alone.
export function useClearMarginVenuePinOnQuoteError({
  market,
  quoteError,
  hasQuote,
}: {
  market: MarginMarket
  quoteError: unknown
  hasQuote: boolean
}): void {
  const pairKey = marginPairKey({ collateralToken: market.collateral.address, debtToken: market.debt.address })
  const hasPinOnPair = useMarginFormStore((s) => s.pinnedVenue?.pairKey === pairKey)
  const { setMarginFormState } = useMarginFormStoreActions()
  const venueCannotFill = !hasQuote && isMarginVenueCannotFillError(quoteError)
  useEffect(() => {
    if (venueCannotFill && hasPinOnPair) {
      setMarginFormState({ pinnedVenue: undefined })
    }
  }, [venueCannotFill, hasPinOnPair, setMarginFormState])
}
