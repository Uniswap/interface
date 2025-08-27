import { isMobileWeb } from 'utilities/src/platform'

const RIGHT_AXIS_WIDTH = 64
const CHART_CONTAINER_WIDTH = 586 + RIGHT_AXIS_WIDTH
const LIQUIDITY_CHART_WIDTH = 68
const INTER_CHART_PADDING = 12
const CHART_HEIGHT = 164
const BOTTOM_AXIS_HEIGHT = 28
const loadedPriceChartWidth = CHART_CONTAINER_WIDTH - LIQUIDITY_CHART_WIDTH - INTER_CHART_PADDING - RIGHT_AXIS_WIDTH

const desktopSizes = {
  rightAxisWidth: RIGHT_AXIS_WIDTH,
  chartContainerWidth: CHART_CONTAINER_WIDTH,
  liquidityChartWidth: LIQUIDITY_CHART_WIDTH,
  interChartPadding: INTER_CHART_PADDING,
  chartHeight: CHART_HEIGHT,
  bottomAxisHeight: BOTTOM_AXIS_HEIGHT,
  loadedPriceChartWidth,
}

const mobileSizes = {
  rightAxisWidth: 0,
  chartContainerWidth: 290,
  liquidityChartWidth: 48,
  interChartPadding: 0,
  chartHeight: CHART_HEIGHT,
  bottomAxisHeight: BOTTOM_AXIS_HEIGHT,
  loadedPriceChartWidth: 290,
}

export function useRangeInputSizes(parentWidth?: number) {
  return isMobileWeb
    ? {
        ...mobileSizes,
        chartContainerWidth: parentWidth ?? mobileSizes.chartContainerWidth,
        loadedPriceChartWidth: parentWidth ?? mobileSizes.loadedPriceChartWidth,
      }
    : desktopSizes
}
