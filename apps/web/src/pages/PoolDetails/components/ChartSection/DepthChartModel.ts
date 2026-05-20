import { ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import { NumberType } from 'utilities/src/format/types'
import { ChartHoverData, ChartModel, ChartModelParams } from '~/components/Charts/ChartModel'
import {
  DepthPoint,
  getMirrorPoint,
  toDisplayPrice,
} from '~/pages/PoolDetails/components/ChartSection/DepthChart.utils'
import {
  buildChartOptions,
  buildCombinedWithGap,
  HIDDEN_SERIES_OPTIONS,
  sideSeriesOptions,
  tooltipTransform,
} from '~/pages/PoolDetails/components/ChartSection/DepthChartModel.helpers'

export type DepthChartZoomActions = {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

export type TooltipUpdate = { point: DepthPoint; transform: string }

export interface DepthChartModelParams extends ChartModelParams<DepthPoint> {
  sellData: DepthPoint[]
  buyData: DepthPoint[]
  sellColor: string
  buyColor: string
  crosshairColor: string
  isReversed: boolean
  midPrice: number
  onZoomActionsReady?: (actions: DepthChartZoomActions) => void
  onMirrorChange?: (update: TooltipUpdate | null) => void
  onGapChange?: (update: { sell: TooltipUpdate; buy: TooltipUpdate } | null) => void
}

const INITIAL_ZOOM_FRACTION = 0.4
const MAX_VISIBLE_FRACTION = 0.6
const MIN_VISIBLE_POINTS = 10

const OVERLAY_STYLE = {
  position: 'absolute',
  top: '0',
  height: '100%',
  pointerEvents: 'none',
  display: 'none',
  zIndex: '1',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
}

function makeOverlay(parent: HTMLDivElement, extra?: Partial<CSSStyleDeclaration>): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, OVERLAY_STYLE, extra ?? {})
  parent.appendChild(el)
  return el
}

function makeVerticalLine({
  parent,
  zIndex,
  border,
}: {
  parent: HTMLDivElement
  zIndex: string
  border?: string
}): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, {
    position: 'absolute',
    top: '0',
    width: '1px',
    height: '100%',
    pointerEvents: 'none',
    display: 'none',
    zIndex,
    ...(border ? { borderLeft: border } : {}),
  })
  parent.appendChild(el)
  return el
}

export class DepthChartModel extends ChartModel<DepthPoint> {
  protected series: ISeriesApi<'Area'>
  private sellSeries: ISeriesApi<'Area'>
  private buySeries: ISeriesApi<'Area'>
  private timeToPrice = new Map<number, number>()
  private totalPoints = 0
  private sellCount = 0
  private gapTime: UTCTimestamp | null = null
  private isReversed: boolean
  private mirrorLineEl: HTMLDivElement
  private leftOverlayEl: HTMLDivElement
  private rightOverlayEl: HTMLDivElement
  private depthMidPrice = 0
  private depthSellData: DepthPoint[] = []
  private depthBuyData: DepthPoint[] = []
  private onMirrorChange?: (update: TooltipUpdate | null) => void
  private onGapChange?: (update: { sell: TooltipUpdate; buy: TooltipUpdate } | null) => void
  private midLineEl: HTMLDivElement

  constructor(chartDiv: HTMLDivElement, params: DepthChartModelParams) {
    const { combined, gapTime } = buildCombinedWithGap(params)
    super(chartDiv, { ...params, data: combined })

    this.mirrorLineEl = makeVerticalLine({ parent: chartDiv, zIndex: '2', border: '1px dashed rgba(155,155,155,0.4)' })
    this.midLineEl = makeVerticalLine({ parent: chartDiv, zIndex: '1' })
    this.leftOverlayEl = makeOverlay(chartDiv)
    this.rightOverlayEl = makeOverlay(chartDiv)

    this.series = this.api.addAreaSeries()
    this.sellSeries = this.api.addAreaSeries()
    this.buySeries = this.api.addAreaSeries()
    this.totalPoints = combined.length
    this.sellCount = params.sellData.length
    this.gapTime = gapTime
    this.isReversed = params.isReversed
    this.rebuildTimeToPrice(params)

    chartDiv.addEventListener('wheel', this.depthWheelHandler, { passive: false, capture: true })

    this.updateOptions(params)
    this.fitContent()
    this.applyInitialZoom(this.sellCount, this.totalPoints)

    params.onZoomActionsReady?.({
      zoomIn: () => this.zoomByFactor(1.5),
      zoomOut: () => this.zoomByFactor(1 / 1.5),
      resetView: () => this.applyInitialZoom(this.sellCount, this.totalPoints),
    })

    this.api.timeScale().subscribeVisibleLogicalRangeChange(this.updateMidLine)
    this.updateMidLine()
  }

  private zoomByFactor(factor: number) {
    const timeScale = this.api.timeScale()
    const visibleRange = timeScale.getVisibleLogicalRange()
    if (!visibleRange) {
      return
    }
    const center = (visibleRange.from + visibleRange.to) / 2
    const halfRange = (visibleRange.to - visibleRange.from) / 2
    const clamped = this.clampHalfRange(halfRange / factor)
    timeScale.setVisibleLogicalRange({ from: center - clamped, to: center + clamped })
  }

  private rebuildTimeToPrice(params: DepthChartModelParams) {
    this.timeToPrice.clear()
    for (const p of params.sellData) {
      this.timeToPrice.set(p.time as number, toDisplayPrice(p.price, params.isReversed))
    }
    for (const p of params.buyData) {
      this.timeToPrice.set(p.time as number, toDisplayPrice(p.price, params.isReversed))
    }
  }

  private applyInitialZoom(sellCount: number, totalCount: number) {
    if (totalCount === 0) {
      return
    }
    const timeScale = this.api.timeScale()
    const center = this.gapTime === null ? sellCount - 0.5 : sellCount
    const halfWidth = this.clampHalfRange((totalCount / 2) * INITIAL_ZOOM_FRACTION)
    timeScale.setVisibleLogicalRange({ from: center - halfWidth, to: center + halfWidth })
  }

  private clampHalfRange(rawHalfRange: number): number {
    const minHalfRange = MIN_VISIBLE_POINTS / 2
    const maxHalfRange = (this.totalPoints * MAX_VISIBLE_FRACTION) / 2
    return Math.max(minHalfRange, Math.min(maxHalfRange, rawHalfRange))
  }

  private updateMidLine = (): void => {
    if (this.gapTime === null) {
      this.midLineEl.style.display = 'none'
      return
    }
    const paneLeft = this.api.priceScale('left').width()
    const xCoord = this.api.timeScale().timeToCoordinate(this.gapTime)
    if (xCoord === null) {
      this.midLineEl.style.display = 'none'
      return
    }
    this.midLineEl.style.left = `${xCoord + paneLeft}px`
    this.midLineEl.style.display = 'block'
  }

  private hideHoverOverlays(): void {
    this.mirrorLineEl.style.display = 'none'
    this.leftOverlayEl.style.display = 'none'
    this.rightOverlayEl.style.display = 'none'
    this.onMirrorChange?.(null)
    this.onGapChange?.(null)
  }

  private handleGapHover({
    hoverData,
    paneLeft,
    chartWidth,
  }: {
    hoverData: ChartHoverData<DepthPoint>
    paneLeft: number
    chartWidth: number
  }): void {
    const timeScale = this.api.timeScale()
    const sellAnchor = this.depthSellData[this.depthSellData.length - 1]
    const buyAnchor = this.depthBuyData[0]
    const sellXCoord = timeScale.timeToCoordinate(sellAnchor.time)
    const buyXCoord = timeScale.timeToCoordinate(buyAnchor.time)
    if (sellXCoord === null || buyXCoord === null) {
      this.hideHoverOverlays()
      return
    }
    const sellX = sellXCoord + paneLeft
    const buyX = buyXCoord + paneLeft

    this.leftOverlayEl.style.left = '0'
    this.leftOverlayEl.style.width = `${sellX}px`
    this.leftOverlayEl.style.display = 'block'
    this.rightOverlayEl.style.left = `${buyX}px`
    this.rightOverlayEl.style.width = `${chartWidth - buyX}px`
    this.rightOverlayEl.style.display = 'block'
    this.mirrorLineEl.style.left = `${buyX}px`
    this.mirrorLineEl.style.display = 'block'

    const sellRef = this.depthSellData[this.depthSellData.length - 2] ?? sellAnchor
    const buyRef = this.depthBuyData[1] ?? buyAnchor
    const sellY = this.sellSeries.priceToCoordinate(sellRef.value) ?? hoverData.y
    const buyY = this.buySeries.priceToCoordinate(buyRef.value) ?? hoverData.y
    this.onMirrorChange?.(null)
    this.onGapChange?.({
      sell: { point: sellAnchor, transform: tooltipTransform({ x: sellX, y: sellY, chartWidth, faceRight: false }) },
      buy: { point: buyAnchor, transform: tooltipTransform({ x: buyX, y: buyY, chartWidth, faceRight: true }) },
    })
  }

  private updatePrimaryTooltipPosition({
    isSellSide,
    cursorX,
    primaryY,
    chartWidth,
    hoverX,
    paneLeft,
  }: {
    isSellSide: boolean
    cursorX: number
    primaryY: number
    chartWidth: number
    hoverX: number
    paneLeft: number
  }): void {
    const tooltip = document.getElementById(this.tooltipId)
    if (!tooltip) {
      return
    }
    const yFlip = primaryY <= 120
    const yPx = primaryY + (yFlip ? 20 : -20)
    const yPct = yFlip ? '' : ' - 100%'
    const nearRightEdge = cursorX > chartWidth - 160
    const xPart =
      (isSellSide && cursorX >= 160) || nearRightEdge
        ? `calc(${cursorX}px - 100%)`
        : `calc(${hoverX + paneLeft + 10}px)`
    tooltip.style.transform = `translate(${xPart}, calc(${yPx}px${yPct}))`
  }

  protected override onSeriesHover(hoverData?: ChartHoverData<DepthPoint>): void {
    super.onSeriesHover(hoverData)
    if (!hoverData || !this.depthMidPrice) {
      this.hideHoverOverlays()
      return
    }
    const point = hoverData.item

    const paneLeft = this.api.priceScale('left').width()
    const timeScale = this.api.timeScale()
    const chartWidth = this.api.paneSize().width + paneLeft

    if (this.gapTime !== null && (point.time as number) === this.gapTime) {
      this.handleGapHover({ hoverData, paneLeft, chartWidth })
      return
    }

    const firstBuyTime = this.depthBuyData.length > 0 ? (this.depthBuyData[0].time as number) : Infinity
    const isSellSide = (point.time as number) < firstBuyTime
    const currentSideData = isSellSide ? this.depthSellData : this.depthBuyData
    const otherSide = isSellSide ? this.depthBuyData : this.depthSellData

    const fullPoint = currentSideData.find((p) => (p.time as number) === (point.time as number))
    if (!fullPoint) {
      this.hideHoverOverlays()
      return
    }

    const mirror = getMirrorPoint({
      point: fullPoint,
      midPrice: this.depthMidPrice,
      isReversed: this.isReversed,
      otherSideData: otherSide,
    })
    if (!mirror) {
      this.hideHoverOverlays()
      return
    }

    const mirrorXCoord = timeScale.timeToCoordinate(mirror.time)
    const cursorXCoord = timeScale.timeToCoordinate(point.time)
    if (mirrorXCoord === null || cursorXCoord === null) {
      this.hideHoverOverlays()
      return
    }

    const mirrorX = mirrorXCoord + paneLeft
    const cursorX = cursorXCoord + paneLeft
    const leftEdge = Math.min(cursorX, mirrorX)
    const rightEdge = Math.max(cursorX, mirrorX)

    this.leftOverlayEl.style.left = '0'
    this.leftOverlayEl.style.width = `${leftEdge}px`
    this.leftOverlayEl.style.display = 'block'
    this.rightOverlayEl.style.left = `${rightEdge}px`
    this.rightOverlayEl.style.width = `${chartWidth - rightEdge}px`
    this.rightOverlayEl.style.display = 'block'

    this.mirrorLineEl.style.left = `${mirrorX}px`
    this.mirrorLineEl.style.display = 'block'

    const mirrorSeries = isSellSide ? this.buySeries : this.sellSeries
    const rawMirrorY = mirrorSeries.priceToCoordinate(mirror.value) ?? hoverData.y
    this.onGapChange?.(null)

    // Detect when the mirror tooltip would clip at either edge.
    // tooltipTransform's DEADZONE (160px) handles the natural flip, but tooltips wider than
    // 160px still clip when mirrorX ∈ [160, tooltipWidth). Clamp to keep it in view.
    const MIRROR_TOOLTIP_WIDTH = 220
    const isClipLeft = !isSellSide && mirrorX < MIRROR_TOOLTIP_WIDTH
    const isClipRight = isSellSide && mirrorX > chartWidth - MIRROR_TOOLTIP_WIDTH

    let effectiveMirrorX = mirrorX
    let effectiveFaceRight = isSellSide
    if (isClipLeft) {
      effectiveMirrorX = Math.max(mirrorX, 4)
      effectiveFaceRight = true
    } else if (isClipRight) {
      effectiveMirrorX = Math.min(mirrorX, chartWidth - 4)
      effectiveFaceRight = false
    }

    this.onMirrorChange?.({
      point: mirror,
      transform: tooltipTransform({ x: effectiveMirrorX, y: rawMirrorY, chartWidth, faceRight: effectiveFaceRight }),
    })

    const primarySeries = isSellSide ? this.sellSeries : this.buySeries
    const primaryY = primarySeries.priceToCoordinate(fullPoint.value) ?? hoverData.y
    this.updatePrimaryTooltipPosition({
      isSellSide,
      cursorX,
      primaryY,
      chartWidth,
      hoverX: hoverData.x,
      paneLeft,
    })
  }

  private enforceZoomClamp() {
    const timeScale = this.api.timeScale()
    const visibleRange = timeScale.getVisibleLogicalRange()
    if (!visibleRange) {
      return
    }
    const half = (visibleRange.to - visibleRange.from) / 2
    const clamped = this.clampHalfRange(half)
    if (clamped === half) {
      return
    }
    const center = (visibleRange.from + visibleRange.to) / 2
    timeScale.setVisibleLogicalRange({ from: center - clamped, to: center + clamped })
  }

  private depthWheelHandler = (event: WheelEvent): void => {
    if (event.ctrlKey) {
      this.enforceZoomClamp()
      return
    }
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()

    const timeScale = this.api.timeScale()
    const visibleRange = timeScale.getVisibleLogicalRange()
    if (!visibleRange) {
      return
    }
    const rangeWidth = visibleRange.to - visibleRange.from
    const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05
    const center = (visibleRange.from + visibleRange.to) / 2
    const clampedHalfRange = this.clampHalfRange(rangeWidth / 2 / zoomFactor)
    timeScale.setVisibleLogicalRange({ from: center - clampedHalfRange, to: center + clampedHalfRange })
  }

  override remove() {
    this.chartDiv.removeEventListener('wheel', this.depthWheelHandler, { capture: true })
    this.api.timeScale().unsubscribeVisibleLogicalRangeChange(this.updateMidLine)
    for (const el of [this.mirrorLineEl, this.midLineEl, this.leftOverlayEl, this.rightOverlayEl]) {
      el.parentElement?.removeChild(el)
    }
    super.remove()
  }

  private recenterAtMidpoint(): void {
    const timeScale = this.api.timeScale()
    const visibleRange = timeScale.getVisibleLogicalRange()
    if (!visibleRange) {
      this.applyInitialZoom(this.sellCount, this.totalPoints)
      return
    }
    const newCenter = this.gapTime === null ? this.sellCount - 0.5 : this.sellCount
    const half = (visibleRange.to - visibleRange.from) / 2
    const clamped = this.clampHalfRange(half)
    timeScale.setVisibleLogicalRange({ from: newCenter - clamped, to: newCenter + clamped })
  }

  override updateOptions(params: DepthChartModelParams) {
    const reversedChanged = this.isReversed !== params.isReversed
    const prevSellCount = this.sellCount
    const { combined, gapTime } = buildCombinedWithGap(params)
    this.rebuildTimeToPrice(params)
    this.totalPoints = combined.length
    this.sellCount = params.sellData.length
    this.gapTime = gapTime
    this.isReversed = params.isReversed
    this.depthMidPrice = params.midPrice
    this.depthSellData = params.sellData
    this.depthBuyData = params.buyData
    this.onMirrorChange = params.onMirrorChange
    this.onGapChange = params.onGapChange
    this.mirrorLineEl.style.borderLeft = `1px dashed ${params.crosshairColor}`
    this.midLineEl.style.borderLeft = `1px solid ${params.crosshairColor}`
    this.updateMidLine()

    const nonDefault = buildChartOptions({
      formatFiat: (n) => params.format.convertFiatAmountFormatted(n, NumberType.FiatTokenStats),
      formatTokenTx: (n) => params.format.formatNumberOrString({ value: n, type: NumberType.TokenTx }),
      crosshairColor: params.crosshairColor,
      tickPriceLookup: (time) => this.timeToPrice.get(time),
    })
    super.updateOptions(params, nonDefault)

    this.series.applyOptions(HIDDEN_SERIES_OPTIONS)
    this.sellSeries.applyOptions(sideSeriesOptions(params.sellColor))
    this.buySeries.applyOptions(sideSeriesOptions(params.buyColor))

    this.series.setData(combined)
    this.sellSeries.setData(params.sellData)
    this.buySeries.setData(params.buyData)

    if (reversedChanged) {
      this.applyInitialZoom(this.sellCount, this.totalPoints)
    } else if (this.sellCount !== prevSellCount) {
      // Sell-side tick count shifted: re-center at the new midpoint while keeping zoom level.
      // Without this, a data refresh that changes the sell/buy split drifts the viewport
      // off-center, showing only one side until the user manually resets.
      this.recenterAtMidpoint()
    }
  }
}
