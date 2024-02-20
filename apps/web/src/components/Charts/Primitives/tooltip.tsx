/**
 * Modified from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/tooltip/tooltip.ts
 * to allow rendering React components atop the canvas
 */
import {
  CrosshairMode,
  IChartApi,
  ISeriesPrimitive,
  MouseEventParams,
  SeriesAttachedParameter,
  Time,
} from 'lightweight-charts'
import React from 'react'
import { Root, createRoot } from 'react-dom/client'
import { ThemeProvider } from 'theme'
import { SeriesDataItemType } from '../ChartModel'

type TooltipBodyComponent<TDataType extends SeriesDataItemType> = React.FunctionComponent<{ data: TDataType }>

interface TooltipCrosshairLineData {
  x: number
  visible: boolean
  topMargin: number
}

interface TooltipPrimitiveOptions<TDataType extends SeriesDataItemType> extends Partial<TooltipOptions> {
  tooltipBody: TooltipBodyComponent<TDataType>
}

export class TooltipPrimitive<TDataType extends SeriesDataItemType> implements ISeriesPrimitive<Time> {
  private _options: TooltipPrimitiveOptions<TDataType>
  private _tooltip: TooltipElement<TDataType> | undefined = undefined
  _data: TooltipCrosshairLineData = {
    x: 0,
    visible: false,
    topMargin: 0,
  }
  _attachedParams: SeriesAttachedParameter<Time> | undefined

  constructor(options: TooltipPrimitiveOptions<TDataType>) {
    this._options = {
      ...options,
    }
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this._attachedParams = param
    this._setCrosshairMode()
    param.chart.subscribeCrosshairMove(this._moveHandler)
    this._createTooltipElement()
  }

  detached(): void {
    const chart = this.chart()
    if (chart) {
      chart.unsubscribeCrosshairMove(this._moveHandler)
    }
  }

  setData(data: TooltipCrosshairLineData) {
    this._data = data
    this._attachedParams?.requestUpdate()
  }

  chart() {
    return this._attachedParams?.chart
  }

  series() {
    return this._attachedParams?.series
  }

  applyOptions(options: Partial<TooltipPrimitiveOptions<TDataType>>) {
    this._options = {
      ...this._options,
      ...options,
    }
    if (this._tooltip) {
      this._tooltip.applyOptions({ ...this._options }, options.tooltipBody)
    }
  }

  private _setCrosshairMode() {
    const chart = this.chart()
    if (!chart) {
      throw new Error('Unable to change crosshair mode because the chart instance is undefined')
    }
    chart.applyOptions({
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          visible: false,
          labelVisible: false,
        },
        horzLine: {
          visible: false,
          labelVisible: false,
        },
      },
    })
  }

  private _moveHandler = (param: MouseEventParams) => this._onMouseMove(param)

  private _hideTooltip() {
    if (!this._tooltip) return
    this._tooltip.updateTooltipData(undefined)
    this._tooltip.updatePosition({
      paneX: 0,
      paneY: 0,
      visible: false,
    })
  }

  private _hideCrosshair() {
    this._hideTooltip()
    this.setData({
      x: 0,
      visible: false,
      topMargin: 0,
    })
  }

  private _onMouseMove(param: MouseEventParams) {
    const chart = this.chart()
    const series = this.series()
    const logical = param.logical
    if (!logical || !chart || !series) {
      this._hideCrosshair()
      return
    }
    const data = param.seriesData.get(series) as TDataType | undefined
    if (!data) {
      this._hideCrosshair()
      return
    }
    const coordinate = chart.timeScale().logicalToCoordinate(logical)
    if (this._tooltip) {
      const tooltipOptions = this._tooltip.options()
      const topMargin = tooltipOptions.followMode == 'top' ? tooltipOptions.topOffset + 10 : 0

      this.setData({
        x: coordinate ?? 0,
        visible: coordinate !== null,
        topMargin,
      })
      this._tooltip.updateTooltipData(data)
      this._tooltip.updatePosition({
        paneX: param.point?.x ?? 0,
        paneY: param.point?.y ?? 0,
        visible: true,
      })
    }
  }

  private _createTooltipElement() {
    const chart = this.chart()
    if (!chart) throw new Error('Unable to create Tooltip element. Chart not attached')
    this._tooltip = new TooltipElement(chart, { ...this._options }, this._options.tooltipBody)
  }
}

interface TooltipOptions {
  followMode: 'top' | 'tracking'
  /** fallback horizontal deadzone width */
  horizontalDeadzoneWidth: number
  verticalDeadzoneHeight: number
  verticalSpacing: number
  /** topOffset is the vertical spacing when followMode is 'top' */
  topOffset: number
}

const defaultTooltipOptions: TooltipOptions = {
  followMode: 'tracking',
  horizontalDeadzoneWidth: 45,
  verticalDeadzoneHeight: 100,
  verticalSpacing: 20,
  topOffset: 20,
}

interface TooltipPosition {
  visible: boolean
  paneX: number
  paneY: number
}

class TooltipElement<TDataType extends SeriesDataItemType> {
  private _chart: IChartApi | null
  private _element: HTMLDivElement | null
  private tooltipRoot: Root

  private _options: TooltipOptions

  private _lastTooltipWidth: number | null = null
  private TooltipBody: TooltipBodyComponent<TDataType>

  public constructor(chart: IChartApi, options: Partial<TooltipOptions>, TooltipBody: TooltipBodyComponent<TDataType>) {
    this._options = {
      ...defaultTooltipOptions,
      ...options,
    }
    this._chart = chart
    this.TooltipBody = TooltipBody

    const element = document.createElement('div')

    applyStyle(element, {
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      position: 'absolute',
      opacity: '0',
      left: '0%',
      top: '0',
      'z-index': '100',
    })

    const chartElement = this._chart.chartElement()
    chartElement.appendChild(element)
    this.tooltipRoot = createRoot(element)
    this._element = element

    const chartElementParent = chartElement.parentElement
    if (!chartElementParent) {
      console.error('Chart Element is not attached to the page.')
      return
    }
    const position = getComputedStyle(chartElementParent).position
    if (position !== 'relative' && position !== 'absolute') {
      console.error('Chart Element position is expected be `relative` or `absolute`.')
    }
  }

  public destroy() {
    if (this._chart && this._element) {
      this.tooltipRoot.unmount()
      this._chart.chartElement().removeChild(this._element)
    }
  }

  public applyOptions(options: Partial<TooltipOptions>, TooltipBody?: TooltipBodyComponent<TDataType>) {
    this._options = {
      ...this._options,
      ...options,
    }
    if (TooltipBody) {
      this.TooltipBody = TooltipBody
    }
  }

  public options(): TooltipOptions {
    return this._options
  }

  public updateTooltipData(tooltipData: TDataType | undefined) {
    if (!this._element || !tooltipData) return

    this.tooltipRoot.render(
      <ThemeProvider>
        <this.TooltipBody data={tooltipData} />
      </ThemeProvider>
    )

    const tooltipMeasurement = this._element.getBoundingClientRect()
    this._lastTooltipWidth = tooltipMeasurement.width
  }

  public updatePosition(positionData: TooltipPosition) {
    if (!this._chart || !this._element) return
    this._element.style.opacity = positionData.visible ? '1' : '0'
    if (!positionData.visible) {
      return
    }

    const x = this._calculateXPosition(positionData, this._chart)
    const y = this._calculateYPosition(positionData)
    this._element.style.transform = `translate(${x}, ${y})`
  }

  private _calculateXPosition(positionData: TooltipPosition, chart: IChartApi): string {
    const x = positionData.paneX + chart.priceScale('left').width() + 10
    const deadzoneWidth = this._lastTooltipWidth
      ? Math.ceil(this._lastTooltipWidth)
      : this._options.horizontalDeadzoneWidth
    const xAdjusted = Math.min(x, chart.paneSize().width - deadzoneWidth)

    return `calc(${xAdjusted}px)`
  }

  private _calculateYPosition(positionData: TooltipPosition): string {
    if (this._options.followMode == 'top') {
      return `${this._options.topOffset}px`
    }
    const y = positionData.paneY
    const flip = y <= this._options.verticalSpacing + this._options.verticalDeadzoneHeight
    const yPx = y + (flip ? 1 : -1) * this._options.verticalSpacing
    const yPct = flip ? '' : ' - 100%'
    return `calc(${yPx}px${yPct})`
  }
}

function applyStyle(element: HTMLElement, styles: Record<string, string>) {
  for (const [key, value] of Object.entries(styles)) {
    element.style.setProperty(key, value)
  }
}
