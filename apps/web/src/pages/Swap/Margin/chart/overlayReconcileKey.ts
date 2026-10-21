import type { MarginChartOverlays } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'

// Reconcile guard key: every rendered price-line attribute + autoscale bounds + markers + zone + the
// low-price-range scale factor. A change means the model rebuilds overlays and clears any parked-cursor
// dwell explainer. Pure + colocated so it's unit-testable without instantiating lightweight-charts.
export function computeOverlaysReconcileKey({
  overlays,
  factor,
}: {
  overlays: MarginChartOverlays
  factor: number
}): string {
  return [
    factor,
    overlays.priceLines
      .map((line) =>
        [
          line.id,
          line.price,
          line.color,
          line.axisLabelColor,
          line.axisLabelTextColor,
          line.title,
          line.lineStyle,
          line.lineWidth ?? 1,
          line.axisLabelVisible ?? true,
          line.opacity ?? 1,
        ].join(':'),
      )
      .join('|'),
    // Bounds no longer drive the autoscaleInfoProvider install (applyVerticalAutoscale memoizes its
    // own inputs); kept in the key so a bounds shift still clears a parked dwell explainer.
    overlays.autoscaleBounds ? `${overlays.autoscaleBounds.min}:${overlays.autoscaleBounds.max}` : '',
    overlays.markers.map((m) => `${m.time}:${m.price}:${m.kind}`).join('|'),
    overlays.zone ? `${overlays.zone.edgePrice}:${overlays.zone.side}:${overlays.zone.emphasis}` : '',
  ].join('#')
}
