import { MAX_VERTICAL_ZOOM_STEP, zoomedPriceRange } from '~/pages/Swap/Margin/chart/verticalZoom'

const candleRange = { minValue: 3000, maxValue: 3200 }
// Far liq line below, mark slightly above the candles — the reported compression scenario.
const bounds = { min: 1500, max: 3250 }

describe('zoomedPriceRange', () => {
  it('step 0 reproduces the legacy candles ∪ bounds union exactly', () => {
    expect(zoomedPriceRange({ candleRange, bounds, step: 0 })).toEqual({
      minValue: Math.min(candleRange.minValue, bounds.min),
      maxValue: Math.max(candleRange.maxValue, bounds.max),
    })
  })

  it('step 0 is bit-identical to Math.min/Math.max for non-dyadic prices', () => {
    // a − (a−b) drifts ulps off Math.min(a, b) for inexact subtractions (2999.9 − 1999.8 rounds
    // up) — step 0 must not.
    const range = zoomedPriceRange({
      candleRange: { minValue: 2999.9, maxValue: 3200.7 },
      bounds: { min: 1000.1, max: 5100.9 },
      step: 0,
    })
    expect(range.minValue).toBe(1000.1)
    expect(range.maxValue).toBe(5100.9)
  })

  it('attenuates linearly: steps 1 and 2 keep 2/3 and 1/3 of per-side headroom', () => {
    const step1 = zoomedPriceRange({ candleRange, bounds, step: 1 })
    expect(step1.minValue).toBe(2000)
    expect(step1.maxValue).toBeCloseTo(3233.333333, 5)
    const step2 = zoomedPriceRange({ candleRange, bounds, step: 2 })
    expect(step2.minValue).toBe(2500)
    expect(step2.maxValue).toBeCloseTo(3216.666667, 5)
  })

  it('max step is the pure candle-fit range', () => {
    expect(zoomedPriceRange({ candleRange, bounds, step: MAX_VERTICAL_ZOOM_STEP })).toEqual(candleRange)
  })

  it('each step strictly narrows toward the candles on both sides with headroom', () => {
    let prev = zoomedPriceRange({ candleRange, bounds, step: 0 })
    for (let step = 1; step <= MAX_VERTICAL_ZOOM_STEP; step++) {
      const next = zoomedPriceRange({ candleRange, bounds, step })
      expect(next.minValue).toBeGreaterThan(prev.minValue)
      expect(next.maxValue).toBeLessThan(prev.maxValue)
      expect(next.minValue).toBeLessThanOrEqual(candleRange.minValue)
      expect(next.maxValue).toBeGreaterThanOrEqual(candleRange.maxValue)
      prev = next
    }
  })

  it('one-sided headroom leaves the other edge hugging the candles at every step', () => {
    const belowOnly = { min: 1500, max: 3100 } // max inside the candle range
    for (let step = 0; step <= MAX_VERTICAL_ZOOM_STEP; step++) {
      const range = zoomedPriceRange({ candleRange, bounds: belowOnly, step })
      expect(range.maxValue).toBe(candleRange.maxValue)
    }
  })

  it('bounds inside the candle range are an identity at every step', () => {
    const inside = { min: 3050, max: 3150 }
    for (let step = 0; step <= MAX_VERTICAL_ZOOM_STEP; step++) {
      expect(zoomedPriceRange({ candleRange, bounds: inside, step })).toEqual(candleRange)
    }
  })

  it('is scale-invariant (lowPriceRangeScaleFactor space neutrality)', () => {
    const factor = 1_000_000_000
    for (let step = 0; step <= MAX_VERTICAL_ZOOM_STEP; step++) {
      const raw = zoomedPriceRange({ candleRange, bounds, step })
      const scaled = zoomedPriceRange({
        candleRange: { minValue: candleRange.minValue * factor, maxValue: candleRange.maxValue * factor },
        bounds: { min: bounds.min * factor, max: bounds.max * factor },
        step,
      })
      expect(scaled.minValue / factor).toBeCloseTo(raw.minValue, 6)
      expect(scaled.maxValue / factor).toBeCloseTo(raw.maxValue, 6)
    }
  })

  it('clamps out-of-range steps', () => {
    expect(zoomedPriceRange({ candleRange, bounds, step: -1 })).toEqual(
      zoomedPriceRange({ candleRange, bounds, step: 0 }),
    )
    expect(zoomedPriceRange({ candleRange, bounds, step: 99 })).toEqual(
      zoomedPriceRange({ candleRange, bounds, step: MAX_VERTICAL_ZOOM_STEP }),
    )
  })
})
