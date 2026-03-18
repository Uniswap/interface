import { ColorType, LineStyle } from 'lightweight-charts'
import type { ToucanBidDistributionChartControllerCreateParams } from '~/components/Charts/ToucanChart/bidDistribution/types'
import {
  CHART_DIMENSIONS,
  CHART_FONT_FAMILY,
  LABEL_CONFIG,
} from '~/components/Toucan/Auction/BidDistributionChart/constants'

export function createToucanBidDistributionChartOptions({
  width,
  height,
  colors,
  priceFormatter,
  showYAxis = true,
}: {
  width: number
  height: number
  colors: ToucanBidDistributionChartControllerCreateParams['colors']
  priceFormatter: (price: number) => string
  showYAxis?: boolean
}) {
  return {
    width,
    height,
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: colors.neutral2.val,
      fontSize: LABEL_CONFIG.FONT_SIZE,
      fontFamily: CHART_FONT_FAMILY,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: {
        color: colors.surface3Solid.val,
        style: LineStyle.SparseDotted,
      },
    },
    leftPriceScale: {
      visible: showYAxis,
      borderVisible: false,
      textColor: colors.neutral2.val,
      minimumWidth: showYAxis ? CHART_DIMENSIONS.Y_AXIS_MIN_WIDTH : 0,
      entireTextOnly: true,
    },
    rightPriceScale: {
      visible: false,
    },
    timeScale: {
      visible: true,
      borderVisible: true,
      borderColor: colors.surface3Solid.val,
      fixLeftEdge: true,
      fixRightEdge: true,
      lockVisibleTimeRangeOnResize: true,
      rightBarStaysOnScroll: false,
      timeVisible: false,
      secondsVisible: false,
      tickMarkFormatter: () => '',
    },
    crosshair: {
      horzLine: {
        visible: true,
        style: LineStyle.Dashed,
        width: 1 as const,
        color: colors.neutral3.val,
        labelVisible: false,
      },
      vertLine: {
        visible: true,
        style: LineStyle.Dashed,
        width: 1 as const,
        color: colors.neutral3.val,
        labelVisible: false,
      },
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      mouseWheel: true,
      pinch: true,
      axisPressedMouseMove: {
        time: true,
        price: false,
      },
    },
    localization: {
      priceFormatter,
    },
  }
}
