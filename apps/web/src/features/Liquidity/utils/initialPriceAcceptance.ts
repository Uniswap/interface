import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import type { PriceRangeState } from '~/features/Liquidity/Create/types'

/**
 * How far (in %) the market may move from a new pool's reviewed starting price before the user has to
 * accept the new price to create the pool. Smaller moves are signed at the reviewed price. Same bound as
 * swap's ACCEPT_NEW_TRADE_THRESHOLD.
 */
export const MAX_INITIAL_PRICE_DEVIATION_PERCENT = 1

const TICK_BASE = 1.0001

/** Signed % move from the reviewed starting price to the market price, or undefined if either doesn't parse. */
export function getInitialPriceChangePercent({
  acceptedPrice,
  marketPrice,
}: {
  acceptedPrice: string
  marketPrice: string
}): number | undefined {
  const accepted = Number(acceptedPrice)
  const market = Number(marketPrice)
  if (!(accepted > 0) || !(market > 0) || !Number.isFinite(accepted) || !Number.isFinite(market)) {
    return undefined
  }
  return ((market - accepted) / accepted) * 100
}

export function exceedsMaxInitialPriceDeviation(changePercent: number | undefined): boolean {
  return changePercent !== undefined && Math.abs(changePercent) > MAX_INITIAL_PRICE_DEVIATION_PERCENT
}

/**
 * Moves a new pool's starting price to `initialPrice` and carries the range with it: both edges shift
 * by the price move, rounded to whole tick spacings, so each bound keeps its distance from the price.
 *
 * `minTick`/`maxTick` and `initialPrice` are both in the field's display orientation (ticks negated
 * when the price is inverted), so a higher displayed price is always a higher tick. An edge at the
 * usable tick limit is 0 or ∞ and stays put.
 */
export function reapplyRangeToInitialPrice({
  priceRangeState,
  initialPrice,
  tickSpacing,
}: {
  priceRangeState: PriceRangeState
  initialPrice: string
  tickSpacing: number
}): PriceRangeState {
  const { minTick, maxTick, fullRange, followedPreset } = priceRangeState
  const fromPrice = Number(priceRangeState.initialPrice)
  const toPrice = Number(initialPrice)
  const next = { ...priceRangeState, initialPrice }

  if (fullRange || minTick === undefined || maxTick === undefined || !(fromPrice > 0) || !(toPrice > 0)) {
    return next
  }

  const tickDelta = Math.round(Math.log(toPrice / fromPrice) / Math.log(TICK_BASE) / tickSpacing) * tickSpacing
  if (!Number.isFinite(tickDelta) || tickDelta === 0) {
    return next
  }

  const lowestTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
  const highestTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)
  const shift = (tick: number): number =>
    tick <= lowestTick || tick >= highestTick ? tick : Math.min(Math.max(tick + tickDelta, lowestTick), highestTick)

  const presetUntouched = followedPreset?.minTick === minTick && followedPreset.maxTick === maxTick
  return {
    ...next,
    minTick: shift(minTick),
    maxTick: shift(maxTick),
    followedPreset:
      followedPreset && presetUntouched
        ? { ...followedPreset, minTick: shift(minTick), maxTick: shift(maxTick) }
        : followedPreset,
  }
}
