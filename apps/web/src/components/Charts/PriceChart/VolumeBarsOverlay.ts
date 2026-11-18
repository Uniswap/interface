import type { CanvasRenderingTarget2D } from 'fancy-canvas'
import type {
  IChartApi,
  MouseEventParams,
  IPanePrimitive,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  PaneAttachedParameter,
  Time,
} from 'lightweight-charts'
import {
  findBarRectAt,
  getVolumeBarRects,
  padAnchorsByHalfStep,
  type TimeAnchor,
  type VolumeBarRect,
} from '~/components/Charts/PriceChart/volumeBars'
import type { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'

// The bars take the bottom tenth of the pane; the price scale's bottom margin keeps the line above them.
const VOLUME_PANE_SHARE = 0.1

type VolumeBarsColors = { surface3: { val: string }; neutral3: { val: string } }

type VolumeBarsRendererData = {
  rects: VolumeBarRect[]
  color: string
  /** The hovered bar's bucket start, drawn in `highlightColor`. */
  highlightedTime: number | undefined
  highlightColor: string
}

class VolumeBarsRenderer implements IPrimitivePaneRenderer {
  constructor(private readonly data: VolumeBarsRendererData) {}

  draw(): void {}

  // Under the series, so the price line and its fill sit over the bars.
  drawBackground(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace(({ context, horizontalPixelRatio, verticalPixelRatio, bitmapSize }) => {
      const { rects, color, highlightedTime, highlightColor } = this.data
      rects.forEach(({ time, x, width, height }) => {
        context.fillStyle = time === highlightedTime ? highlightColor : color
        const top = Math.round(bitmapSize.height - height * verticalPixelRatio)
        context.fillRect(
          Math.round(x * horizontalPixelRatio),
          top,
          Math.max(1, Math.round(width * horizontalPixelRatio)),
          bitmapSize.height - top,
        )
      })
    })
  }
}

/**
 * Volume as bars along the bottom of a price chart, each spanning its bucket's stretch of time. Drawn on the
 * pane rather than as a series, so the buckets needn't share the price's timestamps and switching between
 * line and candles leaves them in place.
 */
export class VolumeBarsOverlay implements IPanePrimitive<Time> {
  private chart: IChartApi | undefined
  private requestUpdate: (() => void) | undefined
  private bars: SingleHistogramData[] = []
  private prices: readonly { time: number }[] = []
  private colors: VolumeBarsColors | undefined
  private padEdges = false
  private rects: VolumeBarRect[] = []
  // Where the crosshair sits across the pane while the pointer is over the chart: snapped to the nearest price
  // point, as the crosshair line and the hover tooltip are, so the highlighted bar is the one beside them.
  private pointerX: number | undefined
  private hoveredBar: SingleHistogramData | undefined
  private onHover: ((bar: SingleHistogramData | undefined) => void) | undefined
  private readonly view: IPrimitivePaneView = {
    renderer: () => {
      return new VolumeBarsRenderer({
        rects: this.rects,
        color: this.colors?.surface3.val ?? '',
        highlightedTime: this.hoveredBar?.time,
        highlightColor: this.colors?.neutral3.val ?? '',
      })
    },
  }
  private readonly onCrosshairMove = ({ point, time }: MouseEventParams<Time>): void => {
    const snappedX = time === undefined ? null : this.chart?.timeScale().timeToCoordinate(time)
    this.pointerX = point ? (snappedX ?? point.x) : undefined
    this.updateHoveredBar()
    this.requestUpdate?.()
  }

  /** The bar under the pointer, by x alone, so a bar is picked wherever the pointer is up the chart. */
  private updateHoveredBar(): void {
    const rect = this.pointerX === undefined ? undefined : findBarRectAt(this.rects, this.pointerX)
    const bar = rect && this.bars.find(({ time }) => time === rect.time)
    if (bar !== this.hoveredBar) {
      this.hoveredBar = bar
      this.onHover?.(bar)
    }
  }

  constructor(api: IChartApi) {
    api.panes()[0].attachPrimitive(this)
  }

  attached({ chart, requestUpdate }: PaneAttachedParameter<Time>): void {
    this.chart = chart as IChartApi
    this.requestUpdate = requestUpdate
    this.chart.subscribeCrosshairMove(this.onCrosshairMove)
  }

  detached(): void {
    this.chart?.unsubscribeCrosshairMove(this.onCrosshairMove)
    this.chart = undefined
    this.requestUpdate = undefined
  }

  /** `prices` are the price series' points, in time order, which place the buckets across the pane. */
  update({
    bars,
    prices,
    colors,
    padEdges = false,
    onHover,
  }: {
    bars?: SingleHistogramData[]
    prices: readonly { time: number }[]
    colors: VolumeBarsColors
    /** The prices are candles, drawn centred on their times, so the pane runs half a candle past each end. */
    padEdges?: boolean
    /** Called with the bar under the pointer, and undefined over a quiet bucket or once it leaves the chart. */
    onHover?: (bar: SingleHistogramData | undefined) => void
  }): void {
    this.bars = bars ?? []
    this.prices = prices
    this.colors = colors
    this.padEdges = padEdges
    this.onHover = onHover
    this.requestUpdate?.()
  }

  updateAllViews(): void {
    const chart = this.chart
    if (!chart || this.bars.length === 0) {
      this.rects = []
      this.updateHoveredBar()
      return
    }
    const timeScale = chart.timeScale()
    const anchors: TimeAnchor[] = []
    for (const { time } of this.prices) {
      const x = timeScale.timeToCoordinate(time as Time)
      if (x !== null) {
        anchors.push({ time, x })
      }
    }
    const paneHeight = chart.panes()[0].getHeight()
    this.rects = getVolumeBarRects({
      bars: this.bars,
      anchors: this.padEdges ? padAnchorsByHalfStep(anchors) : anchors,
      maxHeight: paneHeight * VOLUME_PANE_SHARE,
    })
    this.updateHoveredBar()
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this.view]
  }
}
