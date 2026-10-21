import { LineStyle, type UTCTimestamp } from 'lightweight-charts'
import { describe, expect, it } from 'vitest'
import { computeOverlaysReconcileKey } from '~/pages/Swap/Margin/chart/overlayReconcileKey'
import type { MarginChartOverlays, MarginOverlayLine } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'

const line = (overrides?: Partial<MarginOverlayLine>): MarginOverlayLine => ({
  id: 'entry',
  role: 'entry',
  priority: 1,
  price: 100,
  color: '#ffffff',
  title: 'Entry',
  lineStyle: LineStyle.Solid,
  axisLabelColor: '#111111',
  axisLabelTextColor: '#eeeeee',
  ...overrides,
})

const overlays = (overrides?: Partial<MarginChartOverlays>): MarginChartOverlays => ({
  priceLines: [line()],
  markers: [],
  autoscaleBounds: { min: 90, max: 110 },
  ...overrides,
})

const keyOf = (o: MarginChartOverlays, factor = 1): string => computeOverlaysReconcileKey({ overlays: o, factor })

describe('computeOverlaysReconcileKey', () => {
  it('returns an identical key for identical overlays + factor', () => {
    expect(keyOf(overlays())).toBe(keyOf(overlays()))
  })

  it('changes when a price line opacity goes undefined → 0.5 (the stale-mark dim trigger)', () => {
    expect(keyOf(overlays({ priceLines: [line({ opacity: 0.5 })] }))).not.toBe(keyOf(overlays()))
  })

  it('changes when a price line price changes', () => {
    expect(keyOf(overlays({ priceLines: [line({ price: 101 })] }))).not.toBe(keyOf(overlays()))
  })

  it('changes when the low-price-range scale factor changes', () => {
    expect(keyOf(overlays(), 2)).not.toBe(keyOf(overlays(), 1))
  })

  // Bounds no longer gate the autoscale provider (applyVerticalAutoscale memoizes its own inputs) —
  // the key segment survives to clear a parked dwell explainer on a bounds shift. Pin that.
  it('changes when autoscale bounds shift or drop', () => {
    expect(keyOf(overlays({ autoscaleBounds: { min: 90, max: 111 } }))).not.toBe(keyOf(overlays()))
    expect(keyOf(overlays({ autoscaleBounds: undefined }))).not.toBe(keyOf(overlays()))
  })

  it('changes when a marker is added', () => {
    const markers: MarginChartOverlays['markers'] = [{ time: 100 as UTCTimestamp, price: 100, kind: 'open' }]
    expect(keyOf(overlays({ markers }))).not.toBe(keyOf(overlays()))
  })

  it('changes when zone.emphasis changes', () => {
    const withEmphasis = (emphasis: number): MarginChartOverlays =>
      overlays({ zone: { edgePrice: 80, side: 'below', emphasis } })
    expect(keyOf(withEmphasis(0.5))).not.toBe(keyOf(withEmphasis(0.9)))
  })
})
