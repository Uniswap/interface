import type { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'

/**
 * Index of the first entry, in entries ascending by tick, whose tick is past `tick`; with `atOrPast`, the first
 * whose tick is at or past it.
 */
export function searchSortedTick({
  entries,
  tick,
  atOrPast = false,
}: {
  entries: ChartEntry[]
  tick: number
  atOrPast?: boolean
}): number {
  let lo = 0
  let hi = entries.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (atOrPast ? entries[mid].tick < tick : entries[mid].tick <= tick) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  return lo
}

/**
 * The amounts locked over [startTick, endTick). Each entry (an initialized tick) holds its amounts over its span up
 * to the next entry, so every overlapping entry gives its share by tick overlap. Liquidity is constant across a
 * span, so a share is off only by the price's drift across the part the range's edge cuts through.
 */
export function sumAmountsOverTicks({
  entries,
  startTick,
  endTick,
}: {
  /** Ascending by tick. */
  entries: ChartEntry[]
  startTick: number
  endTick: number
}): { amount0Locked: number; amount1Locked: number } {
  let amount0Locked = 0
  let amount1Locked = 0
  for (let i = Math.max(0, searchSortedTick({ entries, tick: startTick }) - 1); i < entries.length; i++) {
    const entry = entries[i]
    if (entry.tick >= endTick) {
      break
    }
    const spanEnd = entries.at(i + 1)?.tick ?? endTick
    const overlap = Math.min(spanEnd, endTick) - Math.max(entry.tick, startTick)
    if (overlap <= 0 || spanEnd <= entry.tick) {
      continue
    }
    const share = overlap / (spanEnd - entry.tick)
    amount0Locked += (entry.amount0Locked ?? 0) * share
    amount1Locked += (entry.amount1Locked ?? 0) * share
  }
  return { amount0Locked, amount1Locked }
}
