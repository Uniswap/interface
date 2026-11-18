import { getUsableTickBounds } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'

// How close the two edges' moves must be to read as one "± x%". A range centred on the price in ratio terms
// is never exactly even in percent (-7.2% / +7.8%), but a −50% / +100% one shouldn't read as ±100%.
const SYMMETRIC_MOVE_RATIO = 0.85

const EDGE_TOLERANCE = 1e-9

export type PriceRangeSummary =
  | { kind: 'full' }
  | { kind: 'symmetric'; percent: number }
  | { kind: 'asymmetric'; lowerPercent: number; upperPercent: number }

/** Price moves from the current price to each edge of a tick range, as fractions (-0.02 = 2% below). */
export function getRangeEdgeMoves({
  tickLower,
  tickUpper,
  tickCurrent,
  priceInverted,
}: {
  tickLower: number
  tickUpper: number
  tickCurrent: number
  priceInverted: boolean
}): { lower: number; upper: number } {
  const lower = 1.0001 ** (tickLower - tickCurrent) - 1
  const upper = 1.0001 ** (tickUpper - tickCurrent) - 1
  // Inverting the price swaps which tick bounds it from below and flips each move to its reciprocal.
  return priceInverted ? { lower: 1 / (1 + upper) - 1, upper: 1 / (1 + lower) - 1 } : { lower, upper }
}

/**
 * How the range reads next to the current price: "± x%" when its edges move the price by about as much
 * each way (like the chart's default), otherwise each edge.
 */
export function getPriceRangeSummary({
  fullRange,
  tickLower,
  tickUpper,
  tickCurrent,
  tickSpacing,
  priceInverted,
}: {
  fullRange: boolean
  tickLower?: Maybe<number>
  tickUpper?: Maybe<number>
  tickCurrent?: number
  tickSpacing?: number
  priceInverted: boolean
}): PriceRangeSummary | undefined {
  if (fullRange) {
    return { kind: 'full' }
  }
  if (
    tickLower === undefined ||
    tickLower === null ||
    tickUpper === undefined ||
    tickUpper === null ||
    tickCurrent === undefined ||
    tickSpacing === undefined
  ) {
    return undefined
  }

  // An edge at a usable tick is open, a price of 0 or ∞, not the enormous move its tick works out to.
  const usable = getUsableTickBounds(tickSpacing)
  const { lower, upper } = getRangeEdgeMoves({
    tickLower: tickLower <= usable.minTick ? -Infinity : tickLower,
    tickUpper: tickUpper >= usable.maxTick ? Infinity : tickUpper,
    tickCurrent,
    priceInverted,
  })
  const smallerMove = Math.min(Math.abs(lower), Math.abs(upper))
  const largerMove = Math.max(Math.abs(lower), Math.abs(upper))
  const isSymmetric = lower < 0 && upper > 0 && smallerMove >= largerMove * SYMMETRIC_MOVE_RATIO
  if (isSymmetric) {
    return { kind: 'symmetric', percent: largerMove * 100 }
  }
  return { kind: 'asymmetric', lowerPercent: lower * 100, upperPercent: upper * 100 }
}

/**
 * Share of historical prices that sat inside the range, measured against the current price so the
 * history and the range only need to share an orientation, not units.
 */
export function getTimeInRange({
  historicalPrices,
  currentPrice,
  lower,
  upper,
}: {
  historicalPrices: number[]
  currentPrice: number
  lower: number
  upper: number
}): number | undefined {
  if (!historicalPrices.length || currentPrice <= 0) {
    return undefined
  }
  const inRange = historicalPrices.filter((price) => {
    const move = price / currentPrice - 1
    // Float division lands a sample that sits exactly on an edge a hair outside it.
    return move >= lower - EDGE_TOLERANCE && move <= upper + EDGE_TOLERANCE
  })
  return inRange.length / historicalPrices.length
}

/**
 * The decimals worth showing for a price move: none from 10%, one from 1%, two below that, so a tight stable
 * range doesn't round to 0% and a wide one doesn't read 100.0%. Undefined means whole percents.
 */
export function getMovePercentDecimals(percent: number): 1 | 2 | undefined {
  const magnitude = Math.abs(percent)
  return magnitude >= 10 ? undefined : magnitude >= 1 ? 1 : 2
}

/** A move's formatted percent, `+`-prefixed for a rise, so a range's edges read like an open edge's +∞. */
export function withMoveSign(formatted: string, rounded: number): string {
  return rounded > 0 ? `+${formatted}` : formatted
}

/** A price move rounded to the decimals `getMovePercentDecimals` shows for it. */
export function roundMovePercent(percent: number): number {
  const factor = 10 ** (getMovePercentDecimals(percent) ?? 0)
  return Math.round(percent * factor) / factor
}
