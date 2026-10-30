import { calculateMinValidBidQ96, Q96 } from './ticks'

/**
 * A fully diluted valuation as a Q96 price per token base unit: the FDV in raw raise-currency units
 * spread across the token's total supply. The integer floor is fine for a bid ceiling because the
 * submitted price is snapped further down to the auction's tick grid anyway.
 */
export function fdvToPriceQ96({ fdvRaw, totalSupplyRaw }: { fdvRaw: bigint; totalSupplyRaw: bigint }): bigint {
  return (fdvRaw * Q96) / totalSupplyRaw
}

/**
 * The `maxPrice` (Q96) for a market-style bid that stays active up to a fixed valuation ceiling.
 *
 * This is a UNIFORM-price auction: every filled bid pays the same final clearing price, and the
 * bidder commits a fixed budget. So a generous `maxPrice` never overpays — it only keeps the bid
 * included as the clearing price rises. A multiple of the current price is NOT a safe ceiling:
 * clearing can rise past any fixed multiple during the window, silently dropping the bid.
 *
 * `capQ96` snapped DOWN to the floor-anchored tick grid (the contract only accepts tick-boundary
 * prices, and snapping up would overshoot the cap), never below the LOWER BOUND — the larger of the
 * first tick strictly above clearing (the contract minimum) and the first tick above the floor. The
 * floor leg is defense-in-depth: on-chain clearing starts AT the floor and is never 0, so a
 * below-floor clearing is a data gap, not a price; without the clamp, a floor above the cap plus a
 * zero clearing would snap to a sub-floor price the contract rejects.
 *
 * When the floor or the clearing price sits at/above the cap, the result EXCEEDS the cap: it is
 * floor + tick or the first tick above clearing, whichever is higher — still valid on-chain, as the
 * auction constructor requires floor + tickSpacing <= MAX_BID_PRICE. That is the minimal valid bid,
 * not an uncapped one.
 *
 * Throws on a negative price or a non-positive tick size: there is no grid to place a bid on.
 */
export function calculateCappedMaxBidQ96({
  capQ96,
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
}: {
  /** The valuation ceiling as a price — see {@link fdvToPriceQ96}. */
  capQ96: bigint
  clearingPriceQ96: bigint
  floorPriceQ96: bigint
  tickSizeQ96: bigint
}): bigint {
  if (floorPriceQ96 < 0n || clearingPriceQ96 < 0n || tickSizeQ96 <= 0n) {
    throw new Error('Invalid auction price parameters for bid')
  }
  const minValid = calculateMinValidBidQ96({ clearingPriceQ96, floorPriceQ96, tickSizeQ96 })
  // The floor is the contract's lowest valid tick and clearing starts AT it, so floor + tick is the
  // true minimum regardless of the reported clearing. A no-op whenever clearing >= floor.
  const floorMin = floorPriceQ96 + tickSizeQ96
  const lowerBound = minValid > floorMin ? minValid : floorMin
  // Toward-zero division: a floor at or above the cap lands in [cap, floor] here (negative delta,
  // magnitude rounded down), and the lower bound wins.
  const snappedDown = floorPriceQ96 + ((capQ96 - floorPriceQ96) / tickSizeQ96) * tickSizeQ96
  return snappedDown > lowerBound ? snappedDown : lowerBound
}
