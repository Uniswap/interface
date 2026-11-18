import type { PriceRangeState, TickRange } from '~/features/Liquidity/Create/types'

/** A pool tick in the display tick space the range state uses: negated when the price is inverted. */
export function toDisplayTick(tick: number, priceInverted: boolean): number {
  return priceInverted ? -tick : tick
}

/** A pool's tick range in display ticks: when the price is inverted, the edges are negated and swap sides. */
export function toDisplayTickRange(
  { tickLower, tickUpper }: { tickLower: number; tickUpper: number },
  priceInverted: boolean,
): TickRange {
  return priceInverted ? { minTick: -tickUpper, maxTick: -tickLower } : { minTick: tickLower, maxTick: tickUpper }
}

/**
 * The range state in the other price orientation. Display ticks are negated when inverted, so each edge
 * moves to the opposite side and the range itself (the same prices) survives the flip.
 */
export function invertPriceRangeState(state: PriceRangeState): PriceRangeState {
  return {
    ...state,
    priceInverted: !state.priceInverted,
    minTick: state.maxTick === undefined ? undefined : -state.maxTick,
    maxTick: state.minTick === undefined ? undefined : -state.minTick,
    // A preset's ticks are only re-derived while they match the state's, which they no longer do.
    followedPreset: undefined,
  }
}
