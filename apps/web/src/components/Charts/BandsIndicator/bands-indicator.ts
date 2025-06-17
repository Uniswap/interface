import { ClosestTimeIndexFinder } from 'components/Charts/BandsIndicator/helpers/closest-index'
import { UpperLowerInRange } from 'components/Charts/BandsIndicator/helpers/min-max-in-range'
import { cloneReadonly } from 'components/Charts/BandsIndicator/helpers/simple-clone'
import { PluginBase } from 'components/Charts/BandsIndicator/plugin-base'
import { CanvasRenderingTarget2D } from 'fancy-canvas'
import {
  Coordinate,
  DataChangedScope,
  ISeriesPrimitive,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  SeriesAttachedParameter,
  SeriesDataItemTypeMap,
  SeriesType,
  Time,
} from 'lightweight-charts'

interface BandRendererData {
  x: Coordinate | number
  upper: Coordinate | number
  lower: Coordinate | number
}

class BandsIndicatorPaneRenderer implements ISeriesPrimitivePaneRenderer {
  _viewData: BandViewData
  constructor(data: BandViewData) {
    this._viewData = data
  }
  draw() {}
  drawBackground(target: CanvasRenderingTarget2D) {
    const points: BandRendererData[] = this._viewData.data
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context
      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio)

      ctx.strokeStyle = this._viewData.options.lineColor
      ctx.lineWidth = this._viewData.options.lineWidth
      ctx.beginPath()
      const region = new Path2D()
      const lines = new Path2D()
      region.moveTo(points[0]?.x, points[0]?.upper)
      lines.moveTo(points[0]?.x, points[0]?.upper)
      for (const point of points) {
        region.lineTo(point.x, point.upper)
        lines.lineTo(point.x, point.upper)
      }
      const end = points.length - 1
      region.lineTo(points[end]?.x, points[end]?.lower)
      lines.moveTo(points[end]?.x, points[end]?.lower)
      for (let i = points.length - 2; i >= 0; i--) {
        region.lineTo(points[i]?.x, points[i]?.lower)
        lines.lineTo(points[i]?.x, points[i]?.lower)
      }
      region.lineTo(points[0]?.x, points[0]?.upper)
      region.closePath()
      ctx.stroke(lines)
      ctx.fillStyle = this._viewData.options.fillColor
      ctx.fill(region)
    })
  }
}

interface BandViewData {
  data: BandRendererData[]
  options: Required<BandsIndicatorOptions>
}

class BandsIndicatorPaneView implements ISeriesPrimitivePaneView {
  _source: BandsIndicator
  _data: BandViewData

  constructor(source: BandsIndicator) {
    this._source = source
    this._data = {
      data: [],
      options: this._source._options,
    }
  }

  update() {
    const series = this._source.series
    const timeScale = this._source.chart.timeScale()
    this._data.data = this._source._bandsData.map((d) => {
      return {
        x: timeScale.timeToCoordinate(d.time) ?? -100,
        upper: series.priceToCoordinate(d.upper) ?? -100,
        lower: series.priceToCoordinate(d.lower) ?? -100,
      }
    })
  }

  renderer() {
    return new BandsIndicatorPaneRenderer(this._data)
  }
}

interface BandData {
  time: Time
  upper: number
  lower: number
}

interface BandsIndicatorOptions {
  lineColor: string
  fillColor: string
  lineWidth: number
  upperValue: number
  lowerValue: number
}

export class BandsIndicator extends PluginBase implements ISeriesPrimitive<Time> {
  _paneViews: BandsIndicatorPaneView[]
  _seriesData: SeriesDataItemTypeMap[SeriesType][] = []
  _bandsData: BandData[] = []
  _options: Required<BandsIndicatorOptions>
  _timeIndices: ClosestTimeIndexFinder<{ time: number }>
  _upperLower: UpperLowerInRange<BandData>

  constructor(options: Required<BandsIndicatorOptions>) {
    super()
    this._options = options
    this._paneViews = [new BandsIndicatorPaneView(this)]
    this._timeIndices = new ClosestTimeIndexFinder([])
    this._upperLower = new UpperLowerInRange([])
  }

  updateOptions(options: Required<BandsIndicatorOptions>) {
    this._options = options
    this.dataUpdated('full')
  }

  updateAllViews() {
    this._paneViews.forEach((pw) => pw.update())
  }

  paneViews() {
    return this._paneViews
  }

  attached(p: SeriesAttachedParameter<Time>): void {
    super.attached(p)
    this.dataUpdated('full')
  }

  dataUpdated(scope: DataChangedScope) {
    // plugin base has fired a data changed event
    this._seriesData = cloneReadonly(this.series.data())
    this.calculateBands()
    if (scope === 'full') {
      this._timeIndices = new ClosestTimeIndexFinder(this._seriesData as { time: number }[])
    }
  }

  calculateBands() {
    const bandData: BandData[] = this._seriesData.map((d) => {
      return {
        upper: this._options.upperValue,
        lower: this._options.lowerValue,
        time: d.time,
      }
    })
    this._bandsData = bandData
    this._upperLower = new UpperLowerInRange(this._bandsData, 4)
  }
}
