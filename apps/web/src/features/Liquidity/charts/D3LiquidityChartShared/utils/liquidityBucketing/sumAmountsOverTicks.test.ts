import { sumAmountsOverTicks } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/sumAmountsOverTicks'
import type { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'

const entry = (tick: number, amount0Locked: number, amount1Locked: number): ChartEntry => ({
  tick,
  price0: 1,
  liquidityActive: 1,
  amount0Locked,
  amount1Locked,
})

describe('sumAmountsOverTicks', () => {
  const entries = [entry(0, 10, 0), entry(10, 20, 0), entry(30, 0, 40), entry(40, 0, 0)]

  it('sums entries whose spans lie inside the range', () => {
    expect(sumAmountsOverTicks({ entries, startTick: 0, endTick: 40 })).toEqual({
      amount0Locked: 30,
      amount1Locked: 40,
    })
  })

  it('takes a cut span by its tick overlap', () => {
    // Half of [10, 30) and all of [30, 40).
    expect(sumAmountsOverTicks({ entries, startTick: 20, endTick: 40 })).toEqual({
      amount0Locked: 10,
      amount1Locked: 40,
    })
    // The floor entry's span [10, 30) reaches into a range that starts inside it.
    expect(sumAmountsOverTicks({ entries, startTick: 15, endTick: 20 })).toEqual({ amount0Locked: 5, amount1Locked: 0 })
  })

  it('is empty outside the entries', () => {
    expect(sumAmountsOverTicks({ entries, startTick: -20, endTick: 0 })).toEqual({ amount0Locked: 0, amount1Locked: 0 })
  })
})
