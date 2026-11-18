import { describe, expect, it } from 'vitest'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import type { PriceRangeState } from '~/features/Liquidity/Create/types'
import { invertPriceRangeState, toDisplayTick, toDisplayTickRange } from '~/features/Liquidity/utils/displayTicks'

describe('toDisplayTick', () => {
  it('negates the tick only when the price is inverted', () => {
    expect(toDisplayTick(120, false)).toBe(120)
    expect(toDisplayTick(120, true)).toBe(-120)
  })
})

describe('toDisplayTickRange', () => {
  it('keeps the range as is in the pool orientation', () => {
    expect(toDisplayTickRange({ tickLower: -60, tickUpper: 120 }, false)).toEqual({ minTick: -60, maxTick: 120 })
  })

  it('negates and swaps the edges when the price is inverted', () => {
    expect(toDisplayTickRange({ tickLower: -60, tickUpper: 120 }, true)).toEqual({ minTick: -120, maxTick: 60 })
  })
})

describe('invertPriceRangeState', () => {
  const state: PriceRangeState = {
    priceInverted: false,
    fullRange: false,
    initialPrice: '',
    minTick: -198_600,
    maxTick: -197_400,
    followedPreset: { strategy: DefaultPriceStrategy.STABLE, minTick: -198_600, maxTick: -197_400 },
  }

  it('flips the orientation and moves each edge to the other side, keeping the same prices', () => {
    expect(invertPriceRangeState(state)).toMatchObject({ priceInverted: true, minTick: 197_400, maxTick: 198_600 })
  })

  it('is its own inverse for the ticks', () => {
    expect(invertPriceRangeState(invertPriceRangeState(state))).toMatchObject({
      priceInverted: false,
      minTick: state.minTick,
      maxTick: state.maxTick,
    })
  })

  it('keeps an unseeded range unseeded', () => {
    expect(invertPriceRangeState({ ...state, minTick: undefined, maxTick: undefined })).toMatchObject({
      minTick: undefined,
      maxTick: undefined,
    })
  })

  it('stops following a preset, whose ticks no longer match', () => {
    expect(invertPriceRangeState(state).followedPreset).toBeUndefined()
  })
})
