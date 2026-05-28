import {
  AreaSeriesPartialOptions,
  BarPrice,
  DeepPartial,
  LineStyle,
  LineType,
  Time,
  TimeChartOptions,
  UTCTimestamp,
} from 'lightweight-charts'
import { opacify } from 'ui/src/theme'
import { DepthPoint, getGapTime } from '~/pages/PoolDetails/components/ChartSection/DepthChart.utils'

export function buildCombinedWithGap(params: { sellData: DepthPoint[]; buyData: DepthPoint[] }): {
  combined: DepthPoint[]
  gapTime: UTCTimestamp | null
} {
  const gap = getGapTime(params.sellData, params.buyData)
  if (gap === null) {
    return { combined: [...params.sellData, ...params.buyData], gapTime: null }
  }
  const gapTime = gap as UTCTimestamp
  // Sentinel point — never surfaced in the tooltip (special-cased on `gapTime`).
  const gapPoint: DepthPoint = {
    time: gapTime,
    value: 0,
    tick: 0,
    price: 0,
    activeLiquidity: 0,
    swapToMove: 0,
    inputIsToken0: false,
    side: 'sell',
  }
  return { combined: [...params.sellData, gapPoint, ...params.buyData], gapTime }
}

// faceRight=true  → tooltip grows rightward from x (flips left when near right edge)
// faceRight=false → tooltip grows leftward from x  (flips right when near left edge)
export function tooltipTransform({
  x,
  y,
  chartWidth,
  faceRight,
}: {
  x: number
  y: number
  chartWidth: number
  faceRight: boolean
}): string {
  const DEADZONE = 160
  const growRight = faceRight ? x <= chartWidth - DEADZONE : x < DEADZONE
  const xPart = growRight ? `${x}px` : `calc(${x}px - 100%)`
  const yFlip = y <= 120
  const yPx = y + (yFlip ? 20 : -20)
  const yPct = yFlip ? '' : ' - 100%'
  return `translate(${xPart}, calc(${yPx}px${yPct}))`
}

export function buildChartOptions({
  formatFiat,
  formatTokenTx,
  crosshairColor,
  tickPriceLookup,
}: {
  formatFiat: (n: number) => string
  formatTokenTx: (n: number) => string
  crosshairColor: string
  tickPriceLookup: (time: number) => number | undefined
}): DeepPartial<TimeChartOptions> {
  return {
    localization: {
      priceFormatter: (price: BarPrice) => formatFiat(Number(price)),
    },
    leftPriceScale: {
      visible: false,
      borderVisible: false,
      minimumWidth: 0,
    },
    rightPriceScale: {
      visible: false,
      borderVisible: false,
      minimumWidth: 0,
      scaleMargins: { top: 0.1, bottom: 0 },
      autoScale: true,
    },
    timeScale: {
      visible: true,
      borderVisible: false,
      ticksVisible: true,
      timeVisible: true,
      fixLeftEdge: false,
      fixRightEdge: false,
      tickMarkFormatter: (time: Time) => {
        const price = tickPriceLookup(time as number)
        return price === undefined ? '' : formatTokenTx(price)
      },
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { visible: false },
    },
    handleScroll: {
      mouseWheel: false,
      pressedMouseMove: false,
      horzTouchDrag: false,
      vertTouchDrag: false,
    },
    crosshair: {
      horzLine: { visible: false },
      vertLine: {
        color: crosshairColor,
        width: 1,
        style: LineStyle.Dashed,
        labelVisible: false,
      },
    },
  }
}

export const HIDDEN_SERIES_OPTIONS: AreaSeriesPartialOptions = {
  priceScaleId: 'right',
  lineColor: 'transparent',
  topColor: 'transparent',
  bottomColor: 'transparent',
  priceLineVisible: false,
  lastValueVisible: false,
  crosshairMarkerVisible: false,
}

export function sideSeriesOptions(lineColor: string): AreaSeriesPartialOptions {
  return {
    lineType: LineType.WithSteps,
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerRadius: 0,
    priceScaleId: 'right',
    lineColor,
    topColor: opacify(40, lineColor),
    bottomColor: opacify(0, lineColor),
  }
}
