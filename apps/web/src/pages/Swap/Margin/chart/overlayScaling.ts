import type { MarginChartOverlays } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'

// The base PriceChartModel multiplies all series data by lowPriceRangeScaleFactor when the candle
// range is tiny (< $0.20 — quiet-hour 1H charts), so the series renders in SCALED price space while
// the composer works in RAW prices. ALL model-side price↔coordinate interop (price lines, primitive
// prices, autoscale bounds, coordinateToPrice reads, future hover hit-testing) must go through these
// helpers — feeding a raw price to the series draws it at ~0.

export function toScaledPrice({ price, factor }: { price: number; factor: number }): number {
  return price * factor
}

export function fromScaledPrice({ price, factor }: { price: number; factor: number }): number {
  return price / factor
}

// Scaled copy of every overlay surface the model hands to lightweight-charts: line prices, zone
// edge, marker prices, autoscale bounds. Factor 1 returns the input untouched.
export function scaleOverlaysForRender({
  overlays,
  factor,
}: {
  overlays: MarginChartOverlays
  factor: number
}): MarginChartOverlays {
  if (factor === 1) {
    return overlays
  }
  return {
    ...overlays,
    priceLines: overlays.priceLines.map((line) => ({ ...line, price: toScaledPrice({ price: line.price, factor }) })),
    zone: overlays.zone && { ...overlays.zone, edgePrice: toScaledPrice({ price: overlays.zone.edgePrice, factor }) },
    markers: overlays.markers.map((marker) => ({ ...marker, price: toScaledPrice({ price: marker.price, factor }) })),
    autoscaleBounds: overlays.autoscaleBounds && {
      min: toScaledPrice({ price: overlays.autoscaleBounds.min, factor }),
      max: toScaledPrice({ price: overlays.autoscaleBounds.max, factor }),
    },
  }
}

// Maps a series-space (scaled) visible range back to RAW prices for the composer.
export function unscaleVisibleRange({
  range,
  factor,
}: {
  range?: { min: number; max: number }
  factor: number
}): { min: number; max: number } | undefined {
  if (!range) {
    return undefined
  }
  return { min: fromScaledPrice({ price: range.min, factor }), max: fromScaledPrice({ price: range.max, factor }) }
}
