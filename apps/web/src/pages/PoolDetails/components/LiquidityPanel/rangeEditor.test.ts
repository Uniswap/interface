import { describe, expect, it } from 'vitest'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getUsableTickBounds } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import type { PriceRangeState } from '~/features/Liquidity/Create/types'
import {
  formatEditablePercent,
  formatEditablePrice,
  getEditorDomain,
  isRangeEdgeInputValid,
  nextPercentStep,
  percentToDisplayTick,
  setRangeEdge,
  stepRangeEdgeByPercent,
} from '~/pages/PoolDetails/components/LiquidityPanel/rangeEditor'

describe('getEditorDomain', () => {
  it('shows twice the range reach either side of the current tick', () => {
    expect(getEditorDomain({ range: { minTick: 900, maxTick: 1100 }, currentTick: 1000, tickSpacing: 1 })).toEqual({
      minTick: 800,
      maxTick: 1200,
    })
  })

  it('never shrinks below thirty spacings either side', () => {
    expect(getEditorDomain({ range: { minTick: 990, maxTick: 1010 }, currentTick: 1000, tickSpacing: 10 })).toEqual({
      minTick: 700,
      maxTick: 1300,
    })
  })

  it('sizes to the bounded edge of a one-sided range', () => {
    const bounds = getUsableTickBounds(10)
    expect(
      getEditorDomain({ range: { minTick: 1100, maxTick: bounds.maxTick }, currentTick: 1000, tickSpacing: 10 }),
    ).toEqual({
      minTick: 700,
      maxTick: 1300,
    })
  })

  it('stays inside the usable ticks', () => {
    const bounds = getUsableTickBounds(60)
    const currentTick = bounds.maxTick - 600
    const domain = getEditorDomain({
      range: { minTick: currentTick - 6000, maxTick: currentTick + 120 },
      currentTick,
      tickSpacing: 60,
    })
    expect(domain).toEqual({ minTick: currentTick - 12_000, maxTick: bounds.maxTick })
  })

  it('falls back to thirty spacings either side for a full range', () => {
    const bounds = getUsableTickBounds(60)
    expect(getEditorDomain({ range: bounds, currentTick: 0, tickSpacing: 60 })).toEqual({
      minTick: -1800,
      maxTick: 1800,
    })
  })
})

describe('percentToDisplayTick', () => {
  it('moves the price by the percent from the current tick, snapped to the spacing', () => {
    // 1.0001^-1054 is about 0.9; -1054 snaps to -1050 at a spacing of 10
    expect(percentToDisplayTick({ percent: -10, currentTick: 1000, tickSpacing: 10 })).toBe(1000 - 1050)
    expect(percentToDisplayTick({ percent: 0, currentTick: 1000, tickSpacing: 10 })).toBe(1000)
  })

  it('lands its price within a spacing of the percent asked for', () => {
    const tick = percentToDisplayTick({ percent: 25, currentTick: 0, tickSpacing: 60 })
    expect(Math.abs(1.0001 ** tick - 1.25)).toBeLessThan(1.0001 ** 60 - 1)
  })

  it('reads a drop to zero or below as the lowest usable tick', () => {
    const { minTick } = getUsableTickBounds(60)
    expect(percentToDisplayTick({ percent: -100, currentTick: 0, tickSpacing: 60 })).toBe(minTick)
    expect(percentToDisplayTick({ percent: -250, currentTick: 0, tickSpacing: 60 })).toBe(minTick)
  })

  it('stops at the highest usable tick', () => {
    const { maxTick } = getUsableTickBounds(60)
    expect(percentToDisplayTick({ percent: 1e300, currentTick: 0, tickSpacing: 60 })).toBe(maxTick)
  })
})

describe('setRangeEdge', () => {
  const range = { minTick: -600, maxTick: 600 }

  it('snaps the edge to the spacing', () => {
    expect(setRangeEdge({ range, edge: 'min', tick: -1234, tickSpacing: 60 })).toEqual({ minTick: -1260, maxTick: 600 })
  })

  it('stops an edge a spacing short of the other', () => {
    expect(setRangeEdge({ range, edge: 'min', tick: 900, tickSpacing: 60 })).toEqual({ minTick: 540, maxTick: 600 })
    expect(setRangeEdge({ range, edge: 'max', tick: -900, tickSpacing: 60 })).toEqual({ minTick: -600, maxTick: -540 })
  })

  it('clamps to the usable ticks', () => {
    const bounds = getUsableTickBounds(60)
    expect(setRangeEdge({ range, edge: 'max', tick: 10_000_000, tickSpacing: 60 }).maxTick).toBe(bounds.maxTick)
  })
})

describe('nextPercentStep', () => {
  it('snaps a value off the grid to its neighbouring half percent in the direction of the step', () => {
    expect(nextPercentStep({ percent: -6.3, direction: 1 })).toBe(-6)
    expect(nextPercentStep({ percent: -6.3, direction: -1 })).toBe(-6.5)
    expect(nextPercentStep({ percent: 6.1, direction: 1 })).toBe(6.5)
    expect(nextPercentStep({ percent: 6.1, direction: -1 })).toBe(6)
  })

  it('moves a value on the grid a whole step', () => {
    expect(nextPercentStep({ percent: -6.5, direction: 1 })).toBe(-6)
    expect(nextPercentStep({ percent: -6.5, direction: -1 })).toBe(-7)
    expect(nextPercentStep({ percent: 0, direction: 1 })).toBe(0.5)
    expect(nextPercentStep({ percent: 0, direction: -1 })).toBe(-0.5)
  })
})

describe('stepRangeEdgeByPercent', () => {
  // A spacing of one tick moves the price about 0.01%, so a step lands within a hundredth of its percent.
  const currentTick = 0
  const tickSpacing = 1
  const percentAt = (tick: number) => (1.0001 ** (tick - currentTick) - 1) * 100
  const range = {
    minTick: percentToDisplayTick({ percent: -6.3, currentTick, tickSpacing }),
    maxTick: percentToDisplayTick({ percent: 6.1, currentTick, tickSpacing }),
  }
  const step = (r: typeof range, edge: 'min' | 'max', direction: 1 | -1) =>
    stepRangeEdgeByPercent({ range: r, edge, direction, currentTick, tickSpacing })

  it('steps an edge to the next half percent either way', () => {
    expect(percentAt(step(range, 'min', 1)?.minTick ?? 0)).toBeCloseTo(-6, 1)
    expect(percentAt(step(range, 'min', -1)?.minTick ?? 0)).toBeCloseTo(-6.5, 1)
    expect(percentAt(step(range, 'max', 1)?.maxTick ?? 0)).toBeCloseTo(6.5, 1)
  })

  it('keeps stepping from where a step left the edge, though the tick lands a hair off the multiple', () => {
    let next: typeof range | undefined = range
    const percents: number[] = []
    for (let i = 0; i < 4; i++) {
      next = next && step(next, 'min', 1)
      percents.push(Math.round(percentAt(next?.minTick ?? 0) * 10) / 10)
    }
    expect(percents).toEqual([-6, -5.5, -5, -4.5])
  })

  it('moves at least a spacing when the spacing is wider than a step', () => {
    // A spacing of 200 ticks is about 2%, so the nearest half percent rounds back onto the edge's tick.
    const wide = { minTick: -600, maxTick: 600 }
    expect(
      stepRangeEdgeByPercent({ range: wide, edge: 'min', direction: 1, currentTick: 0, tickSpacing: 200 }),
    ).toEqual({
      minTick: -400,
      maxTick: 600,
    })
  })

  it("can't step an edge onto the other", () => {
    expect(
      stepRangeEdgeByPercent({
        range: { minTick: 0, maxTick: 1 },
        edge: 'min',
        direction: 1,
        currentTick,
        tickSpacing,
      }),
    ).toBe(undefined)
  })

  it.each([1, 60])('steps Max down from ∞ (spacing %i)', (spacing) => {
    const bounds = getUsableTickBounds(spacing)
    expect(
      stepRangeEdgeByPercent({
        range: { minTick: 0, maxTick: bounds.maxTick },
        edge: 'max',
        direction: -1,
        currentTick: 0,
        tickSpacing: spacing,
      }),
    ).toEqual({ minTick: 0, maxTick: bounds.maxTick - spacing })
  })

  it("can't step past the usable ticks", () => {
    const bounds = getUsableTickBounds(60)
    expect(
      stepRangeEdgeByPercent({
        range: { minTick: 0, maxTick: bounds.maxTick },
        edge: 'max',
        direction: 1,
        currentTick: 0,
        tickSpacing: 60,
      }),
    ).toBe(undefined)
    expect(
      stepRangeEdgeByPercent({
        range: { minTick: bounds.minTick, maxTick: 0 },
        edge: 'min',
        direction: -1,
        currentTick: 0,
        tickSpacing: 60,
      }),
    ).toBe(undefined)
  })
})

describe('isRangeEdgeInputValid', () => {
  it('takes signed decimals, a lone sign mid-typing, empty, and ∞', () => {
    for (const value of ['', '-', '+', '-10', '+6.8', '2500.', '.5', '∞']) {
      expect(isRangeEdgeInputValid(value)).toBe(true)
    }
  })

  it('rejects anything else', () => {
    for (const value of ['abc', '1,000', '--1', '1-', '1.2.3', '1e5']) {
      expect(isRangeEdgeInputValid(value)).toBe(false)
    }
  })
})

describe('formatEditablePrice', () => {
  it('keeps six significant figures without trailing zeros', () => {
    expect(formatEditablePrice(2241.7612)).toBe('2241.76')
    expect(formatEditablePrice(2500)).toBe('2500')
  })

  it('never falls back to exponent notation', () => {
    expect(formatEditablePrice(0.00000012345678)).toBe('0.000000123457')
  })

  it('reads a zero or invalid price as 0', () => {
    expect(formatEditablePrice(0)).toBe('0')
    expect(formatEditablePrice(Number.NaN)).toBe('0')
  })
})

describe('formatEditablePercent', () => {
  it('writes a huge move as plain digits the input accepts', () => {
    const formatted = formatEditablePercent(3.364673606851828e40)
    expect(formatted).toBe('33646736068518280000000000000000000000000')
    expect(isRangeEdgeInputValid(formatted)).toBe(true)
  })

  it('leaves an ordinary move as it is', () => {
    expect(formatEditablePercent(-6.5)).toBe('-6.5')
  })
})
