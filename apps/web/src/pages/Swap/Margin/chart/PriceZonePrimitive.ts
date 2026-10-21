import type { CanvasRenderingTarget2D } from 'fancy-canvas'
import type { Time } from 'lightweight-charts'
import { opacify } from 'ui/src/theme'
import { PluginBase } from '~/components/Charts/BandsIndicator/plugin-base'
import type {
  ISeriesPrimitive,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
} from '~/pages/Swap/Margin/chart/primitivesCompat'

export interface PriceZone {
  edgePrice: number
  side: 'below' | 'above'
  emphasis: number // 0..1, drives fill opacity
}

// Spec F7: fill opacity ramps 6% (liq far off) → 14% (at-risk) across the composer's 0..1 emphasis.
export function zoneMaxAlphaPct(emphasis: number): number {
  return 6 + 8 * emphasis
}

interface ZoneViewData {
  visible: boolean
  edgeY: number // media-space y of the edge price
  side: 'below' | 'above'
  emphasis: number
  color: string
}

class PriceZonePaneRenderer implements ISeriesPrimitivePaneRenderer {
  private readonly viewData: ZoneViewData
  constructor(data: ZoneViewData) {
    this.viewData = data
  }

  // Nothing on the foreground pass — the fill lives in drawBackground so it sits behind the candles.
  draw(): void {}

  drawBackground(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace((scope) => {
      if (!this.viewData.visible) {
        return
      }
      const ctx = scope.context
      const edgeY = this.viewData.edgeY * scope.verticalPixelRatio
      // 'below' shades from the edge down to the pane bottom; 'above' shades up to the pane top.
      const paneBottom = this.viewData.side === 'below' ? scope.bitmapSize.height : 0
      const top = Math.min(edgeY, paneBottom)
      const height = Math.abs(paneBottom - edgeY)
      if (height <= 0) {
        return
      }
      const grad = ctx.createLinearGradient(0, edgeY, 0, paneBottom)
      grad.addColorStop(0, opacify(Math.round(zoneMaxAlphaPct(this.viewData.emphasis)), this.viewData.color))
      grad.addColorStop(1, opacify(0, this.viewData.color))
      ctx.fillStyle = grad
      ctx.fillRect(0, top, scope.bitmapSize.width, height)
    })
  }
}

class PriceZonePaneView implements ISeriesPrimitivePaneView {
  private readonly source: PriceZonePrimitive
  private readonly data: ZoneViewData

  constructor(source: PriceZonePrimitive) {
    this.source = source
    this.data = { visible: false, edgeY: 0, side: 'below', emphasis: 0, color: '' }
  }

  update(): void {
    const zone = this.source.zone
    if (!zone) {
      this.data.visible = false
      return
    }
    const edgeY = this.source.series.priceToCoordinate(zone.edgePrice)
    if (edgeY === null) {
      this.data.visible = false // edge off-scale / no layout yet → renderer draws nothing
      return
    }
    this.data.visible = true
    this.data.edgeY = edgeY
    this.data.side = zone.side
    this.data.emphasis = zone.emphasis
    this.data.color = this.source.color
  }

  renderer(): ISeriesPrimitivePaneRenderer {
    return new PriceZonePaneRenderer(this.data)
  }
}

// One-sided shaded liquidation zone drawn behind the candles (spec F7). The model owns re-attaching
// it across chart-type series swaps (registered in its attachedPrimitives).
export class PriceZonePrimitive extends PluginBase implements ISeriesPrimitive<Time> {
  zone: PriceZone | undefined
  color = ''
  private readonly views: PriceZonePaneView[]

  constructor() {
    super()
    this.views = [new PriceZonePaneView(this)]
  }

  update({ zone, color }: { zone: PriceZone | undefined; color: string }): void {
    this.zone = zone
    this.color = color
    this.requestUpdate()
  }

  updateAllViews(): void {
    this.views.forEach((view) => view.update())
  }

  paneViews(): PriceZonePaneView[] {
    return this.views
  }
}
