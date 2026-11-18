import type { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import type { TickData } from '~/features/Liquidity/types/ticks'

/**
 * A pool's initialized ticks in the range chart's visual space: as they are, or, when the price is inverted,
 * negated and reversed so they still ascend. Walking them downwards, each one's liquidityNet applies with the
 * opposite sign.
 */
export function toVisualTicks(ticks: TickData[], priceInverted: boolean): TickData[] {
  if (!priceInverted) {
    return ticks
  }
  return ticks
    .map((tick) => ({
      ...tick,
      tick: tick.tick === undefined ? undefined : -tick.tick,
      liquidityNet: tick.liquidityNet ? String(-BigInt(tick.liquidityNet)) : tick.liquidityNet,
    }))
    .reverse()
}

/**
 * The liquidity by tick in the range chart's visual space, ascending by price. When the price is inverted,
 * negating the ticks leaves each entry's locked amounts a position off, so an entry takes the previous canonical
 * one's; the active tick keeps its own, as it holds both tokens.
 */
export function toVisualLiquidityEntries({
  entries,
  currentTick,
  tickSpacing,
  priceInverted,
}: {
  entries: ChartEntry[]
  /** The pool's canonical current tick. */
  currentTick: number
  tickSpacing: number
  priceInverted: boolean
}): ChartEntry[] {
  const activeTick = Math.floor(currentTick / tickSpacing) * tickSpacing
  const byTick = new Map<number, ChartEntry>()
  let prevAmounts: Pick<ChartEntry, 'amount0Locked' | 'amount1Locked'> | undefined
  for (const entry of entries) {
    const visualTick = priceInverted ? -entry.tick : entry.tick
    byTick.set(visualTick, {
      ...entry,
      tick: visualTick,
      ...(priceInverted &&
        entry.tick !== activeTick && {
          amount0Locked: prevAmounts?.amount0Locked ?? 0,
          amount1Locked: prevAmounts?.amount1Locked ?? 0,
        }),
    })
    prevAmounts = entry
  }
  return Array.from(byTick.values()).sort((a, b) => a.price0 - b.price0)
}
