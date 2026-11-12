import type { MarginMarket } from '~/constants/margin'

// POST /margin/quote prices exactly the market `open.marketId` names and never falls back to another,
// so the pick it used to make over the venue allowlist happens here: the cheapest-to-borrow market that
// can carry the leverage and fund the borrow, else the one that goes furthest. Ties keep registry order.
// When no carrying market can fund the borrow, the cheapest carrying one is still picked, so the quote
// refuses with that market's own liquidity error.
export function pickMarginOpenMarket({
  markets,
  leverage,
  getBorrowRateBps,
  canFundBorrow,
}: {
  markets: readonly MarginMarket[]
  leverage: number
  getBorrowRateBps: (market: MarginMarket) => number | undefined
  canFundBorrow: (market: MarginMarket) => boolean
}): MarginMarket | undefined {
  const quotable = markets.filter((market) => market.marketId !== undefined)
  const carrying = quotable.filter((market) => market.maxLeverage !== undefined && market.maxLeverage >= leverage)
  if (!carrying.length) {
    return quotable.reduce<MarginMarket | undefined>(
      (best, market) => (!best || (market.maxLeverage ?? 0) > (best.maxLeverage ?? 0) ? market : best),
      undefined,
    )
  }
  const funding = carrying.filter(canFundBorrow)
  const rate = (market: MarginMarket): number => getBorrowRateBps(market) ?? Number.POSITIVE_INFINITY
  return (funding.length ? funding : carrying).reduce((best, market) => (rate(market) < rate(best) ? market : best))
}

// The open borrows equity × (leverage − 1). An unread liquidity or equity value keeps the market, as the
// server keeps a venue whose balance read failed.
export function canMarginMarketFundBorrow({
  availableBorrowUsd,
  equityUsd,
  leverage,
}: {
  availableBorrowUsd?: number
  equityUsd?: number
  leverage: number
}): boolean {
  if (availableBorrowUsd === undefined || equityUsd === undefined) {
    return true
  }
  return availableBorrowUsd >= equityUsd * (leverage - 1)
}
