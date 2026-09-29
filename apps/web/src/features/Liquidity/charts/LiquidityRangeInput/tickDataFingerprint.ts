import type { TickProcessed } from '~/features/Liquidity/utils/computeSurroundingTicks'

const FNV_OFFSET_BASIS = 0x811c9dc5
const FNV_PRIME = 0x01000193

/**
 * A cheap content fingerprint of a processed tick set, for use in a query key in place of the ticks
 * themselves. Between two tick sets for the same pool state only `tick` and `liquidityNet` vary (the
 * rest is derived from them plus the pool's active tick, liquidity and price, which callers key
 * alongside). FNV-1a is enough here: it only has to tell tick sets apart, not resist collisions.
 */
export function getTickDataFingerprint(data: TickProcessed[]): string {
  let hash = FNV_OFFSET_BASIS
  for (const { tick, liquidityNet } of data) {
    // Terminated so entry boundaries can't shift between sets: `{1:2, 34:5}` and `{1:23, 4:5}` differ.
    const entry = `${tick}:${liquidityNet.toString()};`
    for (let i = 0; i < entry.length; i++) {
      hash = Math.imul(hash ^ entry.charCodeAt(i), FNV_PRIME) >>> 0
    }
  }
  return `${data.length}:${hash.toString(16)}`
}
