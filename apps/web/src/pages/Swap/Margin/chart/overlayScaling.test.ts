import { LineStyle, type UTCTimestamp } from 'lightweight-charts'
import { describe, expect, it } from 'vitest'
import {
  fromScaledPrice,
  scaleOverlaysForRender,
  toScaledPrice,
  unscaleVisibleRange,
} from '~/pages/Swap/Margin/chart/overlayScaling'
import type { MarginChartOverlays, MarginOverlayLine } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'

// Matches PriceChartModel's LOW_PRICE_RANGE_SCALE_FACTOR (engaged when the candle range < $0.20).
const FACTOR = 1_000_000_000

const mkLine = (over?: Partial<MarginOverlayLine>): MarginOverlayLine => ({
  id: 'liq',
  role: 'liq',
  priority: 0,
  price: 2965.37,
  color: '#ff0000',
  title: 'Liq',
  lineStyle: LineStyle.Solid,
  axisLabelColor: '#ff0000',
  axisLabelTextColor: '#ffffff',
  ...over,
})

const mkOverlays = (over?: Partial<MarginChartOverlays>): MarginChartOverlays => ({
  priceLines: [mkLine(), mkLine({ id: 'mark', role: 'mark', priority: 5, price: 3391.2, opacity: 0.4 })],
  zone: { edgePrice: 2965.37, side: 'below', emphasis: 0.5 },
  markers: [{ time: 100 as UTCTimestamp, price: 3200, kind: 'open' }],
  autoscaleBounds: { min: 2900, max: 3500 },
  ...over,
})

describe('toScaledPrice / fromScaledPrice', () => {
  it('multiplies / divides by the factor and round-trips', () => {
    expect(toScaledPrice({ price: 3391.2, factor: FACTOR })).toBe(3391.2 * FACTOR)
    expect(fromScaledPrice({ price: 3391.2 * FACTOR, factor: FACTOR })).toBe(3391.2)
    expect(toScaledPrice({ price: 3391.2, factor: 1 })).toBe(3391.2)
  })
})

describe('scaleOverlaysForRender', () => {
  it('factor 1 is the identity — returns the input object untouched', () => {
    const overlays = mkOverlays()
    expect(scaleOverlaysForRender({ overlays, factor: 1 })).toBe(overlays)
  })

  it('scales all four surfaces: line prices, zone edge, marker prices, autoscale bounds', () => {
    const overlays = mkOverlays()
    const scaled = scaleOverlaysForRender({ overlays, factor: FACTOR })

    expect(scaled.priceLines.map((l) => l.price)).toEqual([2965.37 * FACTOR, 3391.2 * FACTOR])
    expect(scaled.zone?.edgePrice).toBe(2965.37 * FACTOR)
    expect(scaled.markers.map((m) => m.price)).toEqual([3200 * FACTOR])
    expect(scaled.autoscaleBounds).toEqual({ min: 2900 * FACTOR, max: 3500 * FACTOR })
  })

  it('preserves every non-price field and does not mutate the input', () => {
    const overlays = mkOverlays()
    const scaled = scaleOverlaysForRender({ overlays, factor: FACTOR })

    expect(scaled.priceLines[1]).toEqual({ ...overlays.priceLines[1], price: 3391.2 * FACTOR })
    expect(scaled.zone).toEqual({ edgePrice: 2965.37 * FACTOR, side: 'below', emphasis: 0.5 })
    expect(scaled.markers[0]).toEqual({ ...overlays.markers[0], price: 3200 * FACTOR })

    // Raw input untouched — the composer keeps operating in raw price space.
    expect(overlays.priceLines.map((l) => l.price)).toEqual([2965.37, 3391.2])
    expect(overlays.zone?.edgePrice).toBe(2965.37)
    expect(overlays.markers[0].price).toBe(3200)
    expect(overlays.autoscaleBounds).toEqual({ min: 2900, max: 3500 })
  })

  it('keeps absent zone/bounds absent', () => {
    const scaled = scaleOverlaysForRender({
      overlays: mkOverlays({ zone: undefined, autoscaleBounds: undefined }),
      factor: FACTOR,
    })
    expect(scaled.zone).toBeUndefined()
    expect(scaled.autoscaleBounds).toBeUndefined()
  })
})

describe('unscaleVisibleRange', () => {
  it('maps a scaled series-space range back to raw prices', () => {
    expect(unscaleVisibleRange({ range: { min: 2900 * FACTOR, max: 3500 * FACTOR }, factor: FACTOR })).toEqual({
      min: 2900,
      max: 3500,
    })
  })

  it('is the identity at factor 1 and passes undefined through', () => {
    expect(unscaleVisibleRange({ range: { min: 2900, max: 3500 }, factor: 1 })).toEqual({ min: 2900, max: 3500 })
    expect(unscaleVisibleRange({ range: undefined, factor: FACTOR })).toBeUndefined()
  })
})
