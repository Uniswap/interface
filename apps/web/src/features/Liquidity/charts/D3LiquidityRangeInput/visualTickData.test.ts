import {
  toVisualLiquidityEntries,
  toVisualTicks,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/visualTickData'
import type { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'

describe('toVisualTicks', () => {
  const ticks = [
    { tick: -60, liquidityNet: '100' },
    { tick: 120, liquidityNet: '-100' },
  ]

  it('keeps the ticks as they are in the pool orientation', () => {
    expect(toVisualTicks(ticks, false)).toBe(ticks)
  })

  it('negates, flips liquidityNet and reverses the ticks when inverted', () => {
    expect(toVisualTicks(ticks, true)).toEqual([
      { tick: -120, liquidityNet: '100' },
      { tick: 60, liquidityNet: '-100' },
    ])
  })
})

describe('toVisualLiquidityEntries', () => {
  const entry = (tick: number, amount0Locked: number): ChartEntry =>
    ({ tick, price0: 1.0001 ** tick, amount0Locked, amount1Locked: 0 }) as ChartEntry

  it('keeps entries in place in the pool orientation, ascending by price', () => {
    const entries = [entry(60, 2), entry(0, 1)]
    expect(toVisualLiquidityEntries({ entries, currentTick: 0, tickSpacing: 60, priceInverted: false })).toEqual([
      entry(0, 1),
      entry(60, 2),
    ])
  })

  it('shifts the locked amounts a position when inverted, except at the active tick', () => {
    const entries = [entry(0, 1), entry(60, 2), entry(120, 3)]
    const visual = toVisualLiquidityEntries({ entries, currentTick: 0, tickSpacing: 60, priceInverted: true })
    expect(visual.find((e) => e.tick === 0)?.amount0Locked).toBe(1)
    expect(visual.find((e) => e.tick === -60)?.amount0Locked).toBe(1)
    expect(visual.find((e) => e.tick === -120)?.amount0Locked).toBe(2)
  })
})
