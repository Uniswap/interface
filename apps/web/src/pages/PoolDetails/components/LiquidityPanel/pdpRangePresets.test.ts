import { describe, expect, it } from 'vitest'
import { getUsableTickBounds } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import { detectPdpRangePreset, getOneSidedRange } from '~/pages/PoolDetails/components/LiquidityPanel/pdpRangePresets'

const bounds = getUsableTickBounds(60)

describe('getOneSidedRange', () => {
  it('runs from a spacing below the price down to the lowest usable tick', () => {
    expect(getOneSidedRange({ side: 'below', currentTick: 1000, tickSpacing: 60 })).toEqual({
      minTick: bounds.minTick,
      maxTick: 960,
    })
  })

  it('runs from a spacing above the price up to the highest usable tick', () => {
    expect(getOneSidedRange({ side: 'above', currentTick: 1000, tickSpacing: 60 })).toEqual({
      minTick: 1080,
      maxTick: bounds.maxTick,
    })
  })

  it('keeps the range a spacing wide for a price at the edge of the ticks', () => {
    expect(getOneSidedRange({ side: 'above', currentTick: bounds.maxTick, tickSpacing: 60 })).toEqual({
      minTick: bounds.maxTick - 60,
      maxTick: bounds.maxTick,
    })
  })
})

describe('detectPdpRangePreset', () => {
  const base = { fullRange: false, currentTick: 1000, tickSpacing: 60 }

  it('finds each preset', () => {
    expect(detectPdpRangePreset({ ...base, fullRange: true })).toBe('full')
    expect(
      detectPdpRangePreset({
        ...base,
        range: { minTick: 600, maxTick: 1440 },
        suggestedRange: { minTick: 600, maxTick: 1440 },
      }),
    ).toBe('suggested')
    expect(detectPdpRangePreset({ ...base, range: { minTick: bounds.minTick, maxTick: 960 } })).toBe('oneSidedBelow')
    expect(detectPdpRangePreset({ ...base, range: { minTick: 1080, maxTick: bounds.maxTick } })).toBe('oneSidedAbove')
  })

  it('finds none for a custom range', () => {
    expect(detectPdpRangePreset({ ...base, range: { minTick: 600, maxTick: 1200 } })).toBeUndefined()
  })
})
