import { calculateMaxValidBidQ96, snapToNearestTick } from '@universe/cca'
import { priceToQ96WithDecimals, q96ToPriceString } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'

interface ComputeBidMaxPriceQ96Params {
  /** The max-valuation input as a raw bid-token amount. */
  rawAmount: bigint | undefined
  auctionTokenDecimals: number | undefined
  clearingPriceQ96: bigint | undefined
  floorPriceQ96: bigint | undefined
  tickSizeQ96: bigint | undefined
  /** The auction's bid price ceiling, when a validation hook imposes one. */
  maxBidPriceQ96: bigint | undefined
}

/**
 * The Q96 max price a bid will actually be submitted at, from the max-valuation input.
 *
 * This is the value the submit path and the chart's bid line read, so it — not the
 * blur-time validation — is where the auction's constraints have to hold. Every
 * non-keyboard write path into the field (chart tick click, slider, opening the review
 * modal) suppresses the next blur snap, so a check that only runs on blur is skippable
 * by construction; clicking a charted tick above the ceiling is a concrete example.
 *
 * Two constraints, in order:
 *  - snapped to the tick grid, which also absorbs precision loss from the
 *    decimal-string → currency-amount → Q96 round trip;
 *  - clamped to the highest tick at or below the hook's ceiling.
 *
 * A clamped submit bids at the highest legal price rather than reverting with
 * MaxBidPriceExceeded, which is the closest legal reading of the stated intent. Clamping is
 * the only guard: an over-ceiling value is capped everywhere it is written rather than
 * reported back as an error, so the field never holds a price the hook would reject.
 *
 * The clamp is NOT unconditional, and the two exceptions are not covered the same way:
 *
 *  - A ceiling below the floor price has no legal tick, and `isMaxBidPriceReached` reports
 *    the auction closed for exactly that case, so the form is disabled.
 *  - With no tick grid yet there is no clamp target and the price is returned unsnapped.
 *    `isMaxBidPriceReached` does NOT cover this one — it needs the grid itself and reports
 *    false without it. This is the auction-details loading window, before the form has the
 *    data to submit anything; it is not a state the ceiling protects.
 */
export interface BidMaxPriceResult {
  /** The price the bid will be submitted at. */
  q96: bigint | undefined
  /**
   * Whether the ceiling actually had to pull the value down.
   *
   * Decided on the tick grid, never on the raw entry: the field round-trips through a
   * decimal string and both q96 conversions round half-up, so the highest legal tick can
   * reconstruct a hair above the raw ceiling. Comparing entries to the raw ceiling would
   * report the slider's own end as over the limit.
   */
  cappedToMax: boolean
}

/** {@link computeBidMaxPriceQ96}, plus whether the ceiling had to pull the value down. */
export function computeBidMaxPriceResult({
  rawAmount,
  auctionTokenDecimals,
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
  maxBidPriceQ96,
}: ComputeBidMaxPriceQ96Params): BidMaxPriceResult {
  if (rawAmount === undefined || auctionTokenDecimals === undefined) {
    return { q96: undefined, cappedToMax: false }
  }
  if (rawAmount === 0n) {
    return { q96: 0n, cappedToMax: false }
  }

  const unsnappedQ96 = priceToQ96WithDecimals({ priceRaw: rawAmount, auctionTokenDecimals })

  if (!clearingPriceQ96 || !floorPriceQ96 || !tickSizeQ96) {
    return { q96: unsnappedQ96, cappedToMax: false }
  }

  const snappedQ96 = snapToNearestTick({
    value: unsnappedQ96,
    floorPrice: floorPriceQ96,
    clearingPrice: clearingPriceQ96,
    tickSize: tickSizeQ96,
  })

  if (maxBidPriceQ96 === undefined) {
    return { q96: snappedQ96, cappedToMax: false }
  }

  const ceilingTickQ96 = calculateMaxValidBidQ96({ maxBidPriceQ96, floorPriceQ96, tickSizeQ96 })
  if (ceilingTickQ96 === undefined || snappedQ96 <= ceilingTickQ96) {
    return { q96: snappedQ96, cappedToMax: false }
  }

  // Either the entry was above the ceiling, or snapping pushed it there. Both pull back to
  // the ceiling's tick.
  return { q96: ceilingTickQ96, cappedToMax: true }
}

export function computeBidMaxPriceQ96(params: ComputeBidMaxPriceQ96Params): bigint | undefined {
  return computeBidMaxPriceResult(params).q96
}

interface SnapTokenDisplayParams extends Omit<ComputeBidMaxPriceQ96Params, 'rawAmount'> {
  /** The field's current token-denominated string. */
  tokenValue: string
  bidTokenDecimals: number
  /** Parses the display string into a raw bid-token amount. */
  parseRawAmount: (value: string) => bigint | undefined
}

/**
 * The field's token string with the ceiling applied, for write paths that suppress the
 * blur snap and so would otherwise never be corrected.
 *
 * Returns the string untouched unless the ceiling actually binds, which keeps an
 * already-snapped value (a charted tick) at its exact precision.
 */
export function capTokenDisplayValue({
  tokenValue,
  bidTokenDecimals,
  parseRawAmount,
  ...rest
}: Omit<SnapTokenDisplayParams, 'bidTokenDecimals'> & { bidTokenDecimals: number | undefined }): {
  value: string
  cappedToMax: boolean
} {
  const { q96, cappedToMax } = computeBidMaxPriceResult({ ...rest, rawAmount: parseRawAmount(tokenValue) })
  if (!cappedToMax || q96 === undefined || bidTokenDecimals === undefined || rest.auctionTokenDecimals === undefined) {
    return { value: tokenValue, cappedToMax: false }
  }
  const value = q96ToPriceString({ q96Value: q96, bidTokenDecimals, auctionTokenDecimals: rest.auctionTokenDecimals })
  return { value, cappedToMax: true }
}

/**
 * The field's token string, re-snapped to the tick grid for display.
 *
 * Capped to the ceiling like every other write path, so switching denomination cannot leave
 * a price in the field that the hook would reject.
 *
 * Returns undefined when there is nothing to rewrite, so callers leave the field alone.
 */
export function snapTokenDisplayValue({
  tokenValue,
  bidTokenDecimals,
  parseRawAmount,
  ...rest
}: SnapTokenDisplayParams): string | undefined {
  const rawAmount = parseRawAmount(tokenValue)
  if (rawAmount === undefined || rawAmount <= 0n || rest.auctionTokenDecimals === undefined) {
    return undefined
  }
  const snappedQ96 = computeBidMaxPriceQ96({ ...rest, rawAmount })
  if (snappedQ96 === undefined) {
    return undefined
  }
  return q96ToPriceString({ q96Value: snappedQ96, bidTokenDecimals, auctionTokenDecimals: rest.auctionTokenDecimals })
}
