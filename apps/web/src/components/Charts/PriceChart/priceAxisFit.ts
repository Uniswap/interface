import type { AutoscaleInfo, ISeriesApi, SeriesType } from 'lightweight-charts'
import { DEFAULT_BOTTOM_PRICE_SCALE_MARGIN, DEFAULT_TOP_PRICE_SCALE_MARGIN } from '~/components/Charts/ChartModelCore'
import type { PriceWindow } from '~/components/Charts/PriceChart/priceWindow'
import type { DraggableRange } from '~/components/Charts/rangeDrag'

/**
 * How far past the series' own prices, in multiples of their span, an edge may pull the axis. An edge further
 * out (one step in from ∞, or a typed max far above the price) runs off the chart like an open edge instead
 * of flattening the series against the pane.
 */
const MAX_WIDEN_SPANS = 3
// A flat series (a stable pair) has no span to measure against, so it gets at least this share of its price.
const MIN_SPAN_FRACTION = 0.1

/** The autoscale's price range widened to take in a range's bounded edges, as far as `MAX_WIDEN_SPANS`. */
export function widenAutoscaleToRange(
  info: AutoscaleInfo | null,
  { lower, upper }: DraggableRange,
): AutoscaleInfo | null {
  if (!info?.priceRange) {
    return info
  }
  const { minValue, maxValue } = info.priceRange
  const span = Math.max(maxValue - minValue, Math.abs(maxValue) * MIN_SPAN_FRACTION)
  const reach = span * MAX_WIDEN_SPANS
  const isLowerInReach = lower !== undefined && lower >= minValue - reach
  const isUpperInReach = upper !== undefined && upper <= maxValue + reach
  return {
    ...info,
    priceRange: {
      minValue: isLowerInReach ? Math.min(minValue, lower) : minValue,
      maxValue: isUpperInReach ? Math.max(maxValue, upper) : maxValue,
    },
  }
}

/**
 * The window that, shown with the default scale margins as a pinned window is, leaves the axis where it is now,
 * in series units (plotted prices over `scale`). The scale's range sits inside its margins, which a flat series
 * has wider than the default.
 */
export function getVisiblePriceWindow(series: ISeriesApi<SeriesType>, scale: number): PriceWindow | undefined {
  const range = series.priceScale().getVisibleRange()
  if (!range) {
    return undefined
  }
  const { top, bottom } = series.priceScale().options().scaleMargins
  const low = Math.min(range.from, range.to)
  const high = Math.max(range.from, range.to)
  const paneSpan = (high - low) / Math.max(1 - top - bottom, Number.EPSILON)
  return {
    min: (low - bottom * paneSpan + DEFAULT_BOTTOM_PRICE_SCALE_MARGIN * paneSpan) / scale,
    max: (high + top * paneSpan - DEFAULT_TOP_PRICE_SCALE_MARGIN * paneSpan) / scale,
  }
}

/**
 * Fits a series' price axis: pinned to a set window, else taking in a band's edges, else left to the series.
 * The band is taken in only as it stood when it appeared, after a `reset`, a new refit key or a window let go:
 * re-fitting to every edit would rescale the axis under each drag and preset pick, so the price the user is
 * aiming at would keep moving away. The band is in the series' plotted units; the window is in series units,
 * plotted at `scale` times them. While time is zoomed a band is left to the visible prices, so a pinch zooms
 * the price axis with it.
 */
export class PriceAxisFit {
  private fittedBand: DraggableRange | undefined
  private pinnedWindow: PriceWindow | undefined
  private refitKey: number | undefined
  // Clearing a provider makes the chart run a full update, so it's done only when one was set.
  private hasProvider = false

  constructor(private readonly isTimeZoomed: () => boolean = () => false) {}

  /** Forgets what's applied, so the next `update` applies it afresh: for a new series, or new data. */
  reset(): void {
    this.fittedBand = undefined
    this.pinnedWindow = undefined
  }

  /** Re-fits the band on the next `update` whenever the key changes. */
  setRefitKey(refitKey: number | undefined): void {
    if (this.refitKey !== refitKey) {
      this.refitKey = refitKey
      this.fittedBand = undefined
    }
  }

  update(
    series: ISeriesApi<SeriesType>,
    { window: seriesWindow, band, scale }: { window?: PriceWindow; band?: DraggableRange; scale: number },
  ): void {
    const window = seriesWindow && { min: seriesWindow.min * scale, max: seriesWindow.max * scale }
    if (window) {
      if (this.pinnedWindow?.min === window.min && this.pinnedWindow.max === window.max) {
        return
      }
      this.pinnedWindow = window
      this.fittedBand = undefined
      this.hasProvider = true
      series.applyOptions({
        autoscaleInfoProvider: (original: () => AutoscaleInfo | null) => ({
          ...original(),
          priceRange: { minValue: window.min, maxValue: window.max },
        }),
      })
      return
    }

    this.pinnedWindow = undefined
    if (!band) {
      this.fittedBand = undefined
      if (this.hasProvider) {
        this.hasProvider = false
        series.applyOptions({ autoscaleInfoProvider: undefined })
      }
      return
    }
    if (this.fittedBand) {
      return
    }
    const fittedBand = band
    this.fittedBand = fittedBand
    this.hasProvider = true
    series.applyOptions({
      autoscaleInfoProvider: (original: () => AutoscaleInfo | null) =>
        this.isTimeZoomed() ? original() : widenAutoscaleToRange(original(), fittedBand),
    })
  }
}
