/**
 * Bid distribution chart initial zoom policy.
 */
export const BID_DISTRIBUTION_INITIAL_ZOOM = {
  /**
   * - 'concentration': zoom to the concentration band when present
   * - 'clearingPrice': zoom around the clearing price when concentration is missing
   */
  mode: 'concentration' as const,

  /**
   * Padding to apply when zooming to the concentration band.
   *
   * We express this in terms of the full tick-range so it scales with auctions of different widths,
   * and we clamp the expanded range to [minTick, maxTick].
   */
  concentrationPadding: {
    /** Show extra ticks before the concentration start. */
    beforePercentOfFullRange: 0.01,
    /** Show extra ticks after the concentration end. */
    afterPercentOfFullRange: 0.02,
    /** Minimum padding in ticks on either side (prevents “too tight” zooms on small ranges). */
    minPadTicks: 2,
  },
} as const

/**
 * Bid demand chart initial zoom policy.
 *
 * Left edge: a few ticks below clearing price.
 * Right edge: end of concentration band + padding.
 * Fallback (no concentration): clearing price + tick count (same as distribution fallback).
 */
export const BID_DEMAND_INITIAL_ZOOM = {
  /** Number of ticks to show below clearing price on the left side */
  ticksBelowClearingPrice: 5,
  /** Padding after concentration end as a fraction of the full tick range */
  afterConcentrationPercentOfFullRange: 0.02,
  /** Minimum padding ticks on the right side */
  minPadTicksAfter: 2,
} as const
