import { describe, expect, it } from 'vitest'
import { SLIDER_RESOLUTION } from '~/features/Toucan/Shared/valuationSliderParts/constants'
import { positionToTickOffset, tickOffsetToPosition } from '~/features/Toucan/Shared/valuationSliderParts/curve'

describe('valuation slider curve', () => {
  const maxTickOffset = 100_000
  const resolution = SLIDER_RESOLUTION

  it('maps endpoints exactly', () => {
    expect(positionToTickOffset({ position: 0, maxTickOffset, resolution })).toBe(0)
    expect(positionToTickOffset({ position: resolution, maxTickOffset, resolution })).toBe(maxTickOffset)
    expect(tickOffsetToPosition({ tickOffset: 0, maxTickOffset, resolution })).toBe(0)
    expect(tickOffsetToPosition({ tickOffset: maxTickOffset, maxTickOffset, resolution })).toBe(resolution)
  })

  it('clamps out-of-range inputs', () => {
    expect(positionToTickOffset({ position: -10, maxTickOffset, resolution })).toBe(0)
    expect(positionToTickOffset({ position: resolution + 10, maxTickOffset, resolution })).toBe(maxTickOffset)
    expect(tickOffsetToPosition({ tickOffset: -5, maxTickOffset, resolution })).toBe(0)
    expect(tickOffsetToPosition({ tickOffset: maxTickOffset + 5, maxTickOffset, resolution })).toBe(resolution)
  })

  it('handles empty ranges', () => {
    expect(positionToTickOffset({ position: 500, maxTickOffset: 0, resolution })).toBe(0)
    expect(tickOffsetToPosition({ tickOffset: 500, maxTickOffset: 0, resolution })).toBe(0)
  })

  it('is monotonically non-decreasing', () => {
    let prev = -1
    for (let p = 0; p <= resolution; p += 10) {
      const offset = positionToTickOffset({ position: p, maxTickOffset, resolution })
      expect(offset).toBeGreaterThanOrEqual(prev)
      prev = offset
    }
  })

  it('concentrates travel near the clearing price (exponential shape)', () => {
    // At the midpoint, a linear mapping would give maxTickOffset / 2.
    // The exponential curve should give significantly less.
    const mid = positionToTickOffset({ position: resolution / 2, maxTickOffset, resolution })
    expect(mid).toBeLessThan(maxTickOffset / 4)
  })

  it('round-trips at key positions within ±1 slider unit', () => {
    for (const p of [0, 100, 250, 500, 750, 900, resolution]) {
      const offset = positionToTickOffset({ position: p, maxTickOffset, resolution })
      const back = tickOffsetToPosition({ tickOffset: offset, maxTickOffset, resolution })
      expect(Math.abs(back - p)).toBeLessThanOrEqual(1)
    }
  })
})
