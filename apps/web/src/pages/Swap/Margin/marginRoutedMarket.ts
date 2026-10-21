import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginMarketKey, MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { MARGIN_MARKETS_REFETCH_MS, type MarginMarket } from '~/constants/margin'
import { isMarkStale, usablePriceX18 } from '~/pages/Swap/Margin/marginFormat'

// `useMarginMarkets().getMarketByTokens`, narrowed to what this resolver needs.
type GetMarketByTokens = (params: {
  collateralToken: string
  debtToken: string
  venue?: MarginVenue
}) => MarginMarket | undefined

// `useMarginMarkets().getLive`, narrowed to the mark.
type GetLive = (key: MarginMarketKey | undefined) => { markPriceX18: string } | undefined

// A mark of unbounded age is treated as ABSENT rather than as a price. `getLive` serves the last
// SUCCESSFUL markets poll, so a failing or paused refetch keeps serving it indefinitely — and every
// figure priced off it (liquidation distance, price impact, size in USD) reads SAFER when the mark
// lags, on the surfaces where leverage is chosen and confirmed. Callers already handle an absent mark:
// they either hide the row or fall through to the quote's own fill, which is fresh by construction.
//
// The bound has two jobs that must agree: this module decides whether an aged mark is SERVED, and the
// surfaces taking `allowStale` decide whether the row SAYS it is delayed — that disclosure is the
// entire justification for the opt-out. Both `allowStale: true` call sites read `isStale` off the
// `MarginResolvedMark` the resolvers return, which is the pairing to reach for; this export exists for
// a surface that needs the bound WITHOUT resolving a mark, and has no caller in the margin tree today.
export function isMarketsPollStale(marketsUpdatedAt: number): boolean {
  return isMarkStale({ updatedAt: marketsUpdatedAt, now: Date.now(), refetchMs: MARGIN_MARKETS_REFETCH_MS })
}

/**
 * The registry entry for one pair AT one venue, or undefined when the registry has none.
 *
 * Every surface that prices a quote against an oracle mark has to key on the venue the quote actually
 * ROUTED to, never the form's pair-first market: `getLive` is keyed `${pairKey}-${venue}`, so on a
 * re-route those name different venues and the figure would compare one venue's fill against another's
 * mark. Undefined is the honest answer on a miss — the rows that consume the mark already hide
 * themselves without one.
 *
 * Guarded on the venue because `getMarketByTokens` falls back to the pair's FIRST market when given
 * none, which is exactly the substitution this exists to prevent.
 */
export function resolveVenueMarket({
  market,
  venue,
  getMarketByTokens,
}: {
  market: MarginMarket
  venue: MarginVenue | undefined
  getMarketByTokens: GetMarketByTokens
}): MarginMarket | undefined {
  return venue
    ? getMarketByTokens({ collateralToken: market.collateral.address, debtToken: market.debt.address, venue })
    : undefined
}

/**
 * A resolved mark and the freshness of the poll behind it, returned together on purpose: `allowStale`
 * is only defensible because the surface taking it DISCLOSES the delay, so the price and the flag that
 * makes it honest must not be obtainable apart from one another.
 */
export interface MarginResolvedMark {
  // undefined when the registry has no entry, the venue published no usable mark, or the poll aged out
  // and the caller honoured the bound.
  priceX18: string | undefined
  // Whether the markets poll aged out — reported even when the mark was served anyway.
  isStale: boolean
}

/**
 * The oracle mark of the venue a quote actually routed to, or undefined when the registry has no entry
 * for it. For the callers that want only the mark — every figure priced against it (price impact,
 * liquidation distance) hides itself rather than substituting another venue's number.
 */
export function resolveRoutedMarkPriceX18({
  market,
  quote,
  getMarketByTokens,
  getLive,
  marketsUpdatedAt,
  allowStale = false,
}: {
  market: MarginMarket
  quote: MarginQuoteResponse
  getMarketByTokens: GetMarketByTokens
  getLive: GetLive
  marketsUpdatedAt: number
  // The price-impact exception, spelled at the CALL SITE so grep and review can see it. Impact IS
  // mark-vs-fill and cannot fall back to the fill the way the risk figures do, so withholding an aged
  // mark hides the row outright — and `canConfirm` carries no freshness term, so the last screen before
  // funds move would disclose nothing at all. Default false: honouring the bound must be the shorter
  // path, or the opt-out becomes the one that gets written by accident.
  allowStale?: boolean
}): MarginResolvedMark {
  // Differs from its sibling only in how it obtains the market, so the freshness rule is applied in
  // exactly one place rather than restated here.
  return resolvePinnedMarkPriceX18({
    pinnedMarketExact: resolveVenueMarket({ market, venue: quote.legs.at(0)?.venue, getMarketByTokens }),
    getLive,
    marketsUpdatedAt,
    allowStale,
  })
}

/**
 * The price a DISPLAY figure should use: the (bounded) mark where there is one, else the quote's own
 * fill — the nearest honest stand-in, and fresh by construction since it arrived with this quote.
 *
 * Both sides go through usablePriceX18 because `'0'` is a truthy STRING: an unguarded fallback renders
 * the very $0.00 the guard exists to prevent, one branch over.
 */
export function displayMarkPriceX18({
  markPriceX18,
  quote,
}: {
  markPriceX18: string | undefined
  quote: MarginQuoteResponse
}): string | undefined {
  return usablePriceX18(markPriceX18) ?? usablePriceX18(quote.display.effectivePrice)
}

/**
 * The mark for one PINNED venue (the review sheet's shape), under the same freshness bound.
 *
 * Kept beside its sibling so the rule has exactly one owner: every surface that prices a quote against
 * the oracle goes through this module, and `marketsUpdatedAt` is a REQUIRED parameter on both — a new
 * consumer cannot silently opt out of the bound the way a separate check at each call site allowed.
 */
export function resolvePinnedMarkPriceX18({
  pinnedMarketExact,
  getLive,
  marketsUpdatedAt,
  allowStale = false,
}: {
  pinnedMarketExact: MarginMarket | undefined
  getLive: GetLive
  marketsUpdatedAt: number
  // Same exception, same reasoning — see the sibling above.
  allowStale?: boolean
}): MarginResolvedMark {
  const isStale = isMarketsPollStale(marketsUpdatedAt)
  if (!allowStale && isStale) {
    return { priceX18: undefined, isStale }
  }
  return { priceX18: usablePriceX18(getLive(pinnedMarketExact?.key)?.markPriceX18), isStale }
}
