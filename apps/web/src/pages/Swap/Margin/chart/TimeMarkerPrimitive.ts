import type { CanvasRenderingTarget2D } from 'fancy-canvas'
import type { Time, UTCTimestamp } from 'lightweight-charts'
import { PluginBase } from '~/components/Charts/BandsIndicator/plugin-base'
import type {
  ISeriesPrimitive,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
} from '~/pages/Swap/Margin/chart/primitivesCompat'

// One position-event marker. Structurally matches the composer's markers output (kind selects the
// glyph; hover copy is formatted tooltip-side from these raw fields).
export interface TimeMarker {
  time: UTCTimestamp
  price: number
  kind: 'open' | 'decrease'
}

// Marker glyph colors, sourced from the model's theme colors at reconcile.
export interface TimeMarkerColors {
  open: string // ▲ open marker fill (statusSuccess)
  decrease: string // ◆ decrease marker fill (neutral2)
  ring: string // 2px stroke separating the glyph from the candles (surface1)
}

// Glyph half-extent and ring width in media px (scaled into bitmap space at draw time).
const MARKER_RADIUS_PX = 4
const RING_WIDTH_PX = 2

// A resolved on-screen marker: media-space center + which glyph to draw. Nulls (off-screen /
// pre-layout coordinates) are culled before reaching the renderer.
interface MarkerPoint {
  x: number
  y: number
  kind: 'open' | 'decrease'
}

interface MarkerViewData {
  points: MarkerPoint[]
  colors: TimeMarkerColors
}

class TimeMarkerPaneRenderer implements ISeriesPrimitivePaneRenderer {
  private readonly viewData: MarkerViewData
  constructor(data: MarkerViewData) {
    this.viewData = data
  }

  // Foreground pass — markers sit ABOVE the candles (contrast with the zone's drawBackground).
  draw(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context
      const rx = MARKER_RADIUS_PX * scope.horizontalPixelRatio
      const ry = MARKER_RADIUS_PX * scope.verticalPixelRatio
      ctx.lineWidth = RING_WIDTH_PX * scope.verticalPixelRatio
      ctx.strokeStyle = this.viewData.colors.ring
      for (const point of this.viewData.points) {
        const x = point.x * scope.horizontalPixelRatio
        const y = point.y * scope.verticalPixelRatio
        ctx.beginPath()
        if (point.kind === 'open') {
          // ▲ triangle pointing up, centered on the point.
          ctx.moveTo(x, y - ry)
          ctx.lineTo(x - rx, y + ry)
          ctx.lineTo(x + rx, y + ry)
        } else {
          // ◆ 45°-rotated square (diamond).
          ctx.moveTo(x, y - ry)
          ctx.lineTo(x + rx, y)
          ctx.lineTo(x, y + ry)
          ctx.lineTo(x - rx, y)
        }
        ctx.closePath()
        ctx.fillStyle = point.kind === 'open' ? this.viewData.colors.open : this.viewData.colors.decrease
        ctx.fill()
        ctx.stroke()
      }
    })
  }
}

class TimeMarkerPaneView implements ISeriesPrimitivePaneView {
  private readonly source: TimeMarkerPrimitive
  private readonly data: MarkerViewData

  constructor(source: TimeMarkerPrimitive) {
    this.source = source
    this.data = { points: [], colors: { open: '', decrease: '', ring: '' } }
  }

  // Rewritten in place, like PriceZonePaneView: update() runs on every chart REPAINT — each pan and
  // zoom frame — not only when the markers change, so a fresh array plus one object per marker here is
  // per-frame garbage for a set that moves on the positions poll at most.
  update(): void {
    this.data.colors = this.source.colors
    const timeScale = this.source.chart.timeScale()
    const series = this.source.series
    const points = this.data.points
    let visible = 0
    for (const marker of this.source.markers) {
      const x = timeScale.timeToCoordinate(marker.time)
      const y = series.priceToCoordinate(marker.price)
      if (x === null || y === null) {
        continue // off-screen or no layout yet → cull
      }
      // .at(), not [visible]: the index signature is not optional under this tsconfig, so oxlint's
      // type-aware pass reads a bracket access as always-truthy and rejects the guard.
      const slot = points.at(visible)
      if (slot) {
        slot.x = x
        slot.y = y
        slot.kind = marker.kind
      } else {
        points.push({ x, y, kind: marker.kind })
      }
      visible += 1
    }
    // Truncate rather than reassign: culled markers must not linger, and the kept slots are reused.
    points.length = visible
  }

  renderer(): ISeriesPrimitivePaneRenderer {
    return new TimeMarkerPaneRenderer(this.data)
  }
}

// Position event markers drawn above the candles (spec F10): ▲ at open, ◆ at each partial decrease.
// The model owns re-attaching it across chart-type series swaps (registered in attachedPrimitives).
export class TimeMarkerPrimitive extends PluginBase implements ISeriesPrimitive<Time> {
  markers: TimeMarker[] = []
  colors: TimeMarkerColors = { open: '', decrease: '', ring: '' }
  private readonly views: TimeMarkerPaneView[]

  constructor() {
    super()
    this.views = [new TimeMarkerPaneView(this)]
  }

  update({ markers, colors }: { markers: TimeMarker[]; colors: TimeMarkerColors }): void {
    this.markers = markers
    this.colors = colors
    this.requestUpdate()
  }

  updateAllViews(): void {
    this.views.forEach((view) => view.update())
  }

  paneViews(): TimeMarkerPaneView[] {
    return this.views
  }
}
