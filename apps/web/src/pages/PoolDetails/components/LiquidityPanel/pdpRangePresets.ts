import {
  snapTickToSpacing,
  getUsableTickBounds,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import type { TickRange } from '~/features/Liquidity/Create/types'

/** The Edit range presets in the PDP Figma: the pool's suggested range, full range, and one-sided either way. */
export type PdpRangePreset = 'suggested' | 'full' | 'oneSidedBelow' | 'oneSidedAbove'

/**
 * A one-sided range in display ticks: from a spacing past the current price out to the usable tick that way.
 * Below the price it holds only the quote token; above it, only the base token. Like the create flow's
 * one-sided presets, the near edge never reaches the far one, even for a pool at the edge of its ticks.
 */
export function getOneSidedRange({
  side,
  currentTick,
  tickSpacing,
}: {
  side: 'below' | 'above'
  currentTick: number
  tickSpacing: number
}): TickRange {
  const usable = getUsableTickBounds(tickSpacing)
  if (side === 'below') {
    const maxTick = Math.max(usable.minTick + tickSpacing, snapTickToSpacing(currentTick - tickSpacing, tickSpacing))
    return { minTick: usable.minTick, maxTick: Math.min(usable.maxTick, maxTick) }
  }
  const minTick = Math.min(usable.maxTick - tickSpacing, snapTickToSpacing(currentTick + tickSpacing, tickSpacing))
  return { minTick: Math.max(usable.minTick, minTick), maxTick: usable.maxTick }
}

/** Which preset a range is, if any. A one-sided range picked earlier stops matching once the price moves on. */
export function detectPdpRangePreset({
  range,
  fullRange,
  suggestedRange,
  currentTick,
  tickSpacing,
}: {
  range?: TickRange
  fullRange: boolean
  suggestedRange?: TickRange
  currentTick: number
  tickSpacing: number
}): PdpRangePreset | undefined {
  if (fullRange) {
    return 'full'
  }
  if (!range) {
    return undefined
  }
  const isRange = (other?: TickRange) => other?.minTick === range.minTick && other.maxTick === range.maxTick
  if (isRange(suggestedRange)) {
    return 'suggested'
  }
  if (isRange(getOneSidedRange({ side: 'below', currentTick, tickSpacing }))) {
    return 'oneSidedBelow'
  }
  if (isRange(getOneSidedRange({ side: 'above', currentTick, tickSpacing }))) {
    return 'oneSidedAbove'
  }
  return undefined
}
