/* oxlint-disable max-lines */
import { createChart, type IChartApi, type UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { useEvent } from 'utilities/src/react/hooks'
import { LiveDotRenderer } from '~/components/Charts/LiveDotRenderer'
import { formatTickMarks } from '~/components/Charts/utils'
import { CHART_DIMENSIONS } from '~/features/Toucan/Auction/BidDistributionChart/constants'
import type { BidTokenInfo, ChartZoomState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { TooltipContainer } from '~/features/Toucan/Shared/TooltipContainer'
import { ClearingPriceTooltipBody } from '~/features/Toucan/ToucanChart/clearingPrice/components/ClearingPriceTooltipBody'
import { createTimeScaleOptions } from '~/features/Toucan/ToucanChart/clearingPrice/controller/chartOptions'
import { calculateTooltipTransform } from '~/features/Toucan/ToucanChart/clearingPrice/controller/logic/crosshairMove'
import { ToucanClearingPriceChartController } from '~/features/Toucan/ToucanChart/clearingPrice/ToucanClearingPriceChartController'
import type {
  ChartCoordinates,
  ClearingPriceTooltipState,
  NormalizedClearingPriceSeries,
  YAxisLabel,
} from '~/features/Toucan/ToucanChart/clearingPrice/types'
import { deprecatedStyled } from '~/lib/deprecated-styled'

/**
 * For in-progress auctions, the data chart occupies this percentage of the total width.
 * The remaining space shows blank x-axis indicating more auction time remains.
 */
const IN_PROGRESS_DATA_WIDTH_PERCENT = 75

const ChartContainer = deprecatedStyled.div<{ height: number }>`
  width: calc(100% - ${CHART_DIMENSIONS.Y_AXIS_LABEL_WIDTH}px);
  height: 100%;
  margin-left: ${CHART_DIMENSIONS.Y_AXIS_LABEL_WIDTH}px;

  /* Override lightweight-charts inline overflow:hidden to prevent x-axis label cutoff */
  .tv-lightweight-charts {
    overflow: visible !important;
  }

  /* Clip the main plot area to prevent chart line from overflowing into X-axis */
  .tv-lightweight-charts table tr:first-child td:nth-child(2) {
    overflow: hidden;
  }

  /* Match x-axis background to app surface color */
  .tv-lightweight-charts table tr:last-child td {
    background-color: ${({ theme }) => theme.surface1};
  }
`

const ChartWrapper = deprecatedStyled.div<{ height: number }>`
  position: relative;
  width: 100%;
  height: ${({ height }) => height}px;
  overflow: visible;
`

/** Container for the x-axis background chart (full width, x-axis only) */
const XAxisChartContainer = deprecatedStyled.div<{ height: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${({ height }) => height}px;
  pointer-events: none;

  .tv-lightweight-charts {
    overflow: visible !important;
  }

  /* Clip the main plot area to prevent chart content from overflowing into X-axis */
  .tv-lightweight-charts table tr:first-child td:nth-child(2) {
    overflow: hidden;
  }

  /* Match x-axis background to app surface color */
  .tv-lightweight-charts table tr:last-child td {
    background-color: ${({ theme }) => theme.surface1};
  }
`

/** Container for the data chart (partial width for in-progress auctions) */
const DataChartContainer = deprecatedStyled.div<{ height: number; $widthPercent: number }>`
  position: absolute;
  top: 0;
  left: ${CHART_DIMENSIONS.Y_AXIS_LABEL_WIDTH}px;
  width: calc(${({ $widthPercent }) => $widthPercent}% - ${CHART_DIMENSIONS.Y_AXIS_LABEL_WIDTH}px);
  height: ${({ height }) => height}px;
  overflow: hidden;

  .tv-lightweight-charts {
    overflow: hidden !important;
  }
`

const YAxisLabelEl = deprecatedStyled.span`
  position: absolute;
  left: 0;
  font-size: 10px;
  font-family: 'Basel', sans-serif;
  color: ${({ theme }) => theme.neutral2};
  background-color: ${({ theme }) => theme.surface1};
  padding-right: 6px;
  transform: translateY(-50%);
  pointer-events: none;
  white-space: nowrap;
  z-index: 1;
`

interface ClearingPriceChartRendererProps {
  normalizedData: NormalizedClearingPriceSeries
  bidTokenInfo: BidTokenInfo
  maxFractionDigits: number
  tokenColor?: string
  height?: number
  /** Optional callback when visible price range changes (for combined chart Y-axis sync) */
  onVisiblePriceRangeChange?: (range: { min: number; max: number }) => void
  /** When true, disables mouse wheel scroll/scale so an external handler can manage Y-axis pan/zoom */
  disableMouseWheelInteractions?: boolean
  /** Total supply of auction token (raw units) for FDV calculation in tooltip */
  totalSupply?: string
  /** Decimals of the auction token for FDV calculation in tooltip */
  auctionTokenDecimals?: number
}

/**
 * Presentation component for the Clearing Price Chart.
 *
 * For in-progress auctions, uses a two-chart overlay approach:
 * - Background x-axis chart: Full width, shows time scale from auction start to end
 * - Foreground data chart: Partial width based on elapsed time, shows the actual price data
 *
 * For ended auctions, uses a single chart at full width.
 */
export function ClearingPriceChartRenderer({
  normalizedData,
  bidTokenInfo,
  maxFractionDigits,
  tokenColor,
  height = CHART_DIMENSIONS.HEIGHT,
  onVisiblePriceRangeChange,
  disableMouseWheelInteractions,
  totalSupply,
  auctionTokenDecimals,
}: ClearingPriceChartRendererProps): JSX.Element {
  const colors = useSporeColors()
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const xAxisChartContainerRef = useRef<HTMLDivElement | null>(null)
  const xAxisChartRef = useRef<IChartApi | null>(null)
  const controllerRef = useRef<ToucanClearingPriceChartController | null>(null)

  const [tooltipState, setTooltipState] = useState<ClearingPriceTooltipState | null>(null)
  const [hoverCoordinates, setHoverCoordinates] = useState<ChartCoordinates | null>(null)
  const [yAxisLabels, setYAxisLabels] = useState<YAxisLabel[]>([])
  const [isControllerReady, setIsControllerReady] = useState(false)
  const [lastPointCoords, setLastPointCoords] = useState<{ x: number; y: number } | null>(null)
  const { chartZoomCommand, clearingPriceZoomState } = useAuctionStore((state) => ({
    chartZoomCommand: state.chartZoomCommand,
    clearingPriceZoomState: state.clearingPriceZoomState,
  }))
  const { setClearingPriceZoomState, clearChartZoomCommand } = useAuctionStoreActions()

  const handleTooltipStateChange = useEvent((state: ClearingPriceTooltipState | null) => {
    setTooltipState(state)
  })
  const handleHoverCoordinatesChange = useEvent((coordinates: ChartCoordinates | null) => {
    setHoverCoordinates(coordinates)
  })
  const handleZoomStateChange = useEvent((state: ChartZoomState) => {
    // When embedded in combined chart, the parent manages zoom state
    if (!disableMouseWheelInteractions) {
      setClearingPriceZoomState(state)
    }
  })
  const handleYAxisLabelsChange = useEvent((labels: YAxisLabel[]) => {
    setYAxisLabels(labels)
  })
  const handleVisiblePriceRangeChange = useEvent((range: { min: number; max: number }) => {
    onVisiblePriceRangeChange?.(range)
  })

  const dataChartWidthPercent = normalizedData.isAuctionInProgress ? IN_PROGRESS_DATA_WIDTH_PERCENT : 100

  // Calculate the x-axis end time to show ~25% more time past current data
  // This creates arbitrary blank space indicating more auction time remains
  const xAxisEndTime = (() => {
    if (!normalizedData.isAuctionInProgress) {
      return normalizedData.auctionEndTime
    }
    const { visibleRangeStart, endTime, auctionEndTime } = normalizedData
    if (!visibleRangeStart || !endTime) {
      return auctionEndTime
    }
    const elapsed = endTime - visibleRangeStart
    // Extend total visible time so data occupies IN_PROGRESS_DATA_WIDTH_PERCENT of the chart
    const calculatedEnd = visibleRangeStart + Math.ceil(elapsed / (IN_PROGRESS_DATA_WIDTH_PERCENT / 100))
    // Cap at auction end time (don't extend past actual end)
    return auctionEndTime ? Math.min(calculatedEnd, auctionEndTime) : calculatedEnd
  })()

  // X-axis chart lifecycle (only for in-progress auctions)
  useEffect(() => {
    if (!normalizedData.isAuctionInProgress || !xAxisChartContainerRef.current) {
      return undefined
    }

    // Destroy existing x-axis chart
    xAxisChartRef.current?.remove()

    const container = xAxisChartContainerRef.current
    const xAxisChart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        textColor: colors.neutral2.val,
        background: { color: 'transparent' },
      },
      leftPriceScale: { visible: false },
      rightPriceScale: { visible: false },
      timeScale: {
        ...createTimeScaleOptions({
          colors,
          timeSpanDays: normalizedData.timeSpanDays,
          useLogicalRangePositioning: false, // Keep fixRightEdge true for x-axis chart
        }),
        tickMarkFormatter: formatTickMarks,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        horzLine: { visible: false, labelVisible: false },
        vertLine: { visible: false, labelVisible: false },
      },
      handleScroll: false,
      handleScale: false,
    })

    // Add invisible line series with phantom points for x-axis range
    const { visibleRangeStart } = normalizedData
    if (visibleRangeStart && xAxisEndTime) {
      const xAxisSeries = xAxisChart.addLineSeries({
        color: 'transparent',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      })

      // Generate multiple phantom points for better x-axis label precision
      const totalDuration = xAxisEndTime - visibleRangeStart
      const numPoints = Math.max(10, Math.min(20, Math.ceil(totalDuration / 3600))) // 1 point per hour, min 10, max 20
      const phantomPoints: { time: import('lightweight-charts').UTCTimestamp; value: number }[] = []

      for (let i = 0; i <= numPoints; i++) {
        const time = visibleRangeStart + (totalDuration * i) / numPoints
        phantomPoints.push({ time: Math.floor(time) as import('lightweight-charts').UTCTimestamp, value: 0 })
      }

      xAxisSeries.setData(phantomPoints)
      xAxisChart.timeScale().fitContent()
    }

    xAxisChartRef.current = xAxisChart

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      xAxisChart.applyOptions({ width: container.clientWidth })
      xAxisChart.timeScale().fitContent()
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      xAxisChart.remove()
      xAxisChartRef.current = null
    }
  }, [
    normalizedData.isAuctionInProgress,
    normalizedData.visibleRangeStart,
    xAxisEndTime,
    normalizedData.timeSpanDays,
    height,
    colors,
  ])

  // Data chart controller lifecycle
  useEffect(() => {
    if (!chartContainerRef.current) {
      return undefined
    }

    // Destroy existing controller if any (for strict mode double-mount)
    controllerRef.current?.destroy()

    controllerRef.current = new ToucanClearingPriceChartController({
      container: chartContainerRef.current,
      height,
      colors,
      tokenColor,
      bidTokenInfo,
      maxFractionDigits,
      callbacks: {
        onTooltipStateChange: handleTooltipStateChange,
        onHoverCoordinatesChange: handleHoverCoordinatesChange,
        onZoomStateChange: handleZoomStateChange,
        onYAxisLabelsChange: handleYAxisLabelsChange,
        onVisiblePriceRangeChange: handleVisiblePriceRangeChange,
      },
    })
    setIsControllerReady(true)

    return () => {
      controllerRef.current?.destroy()
      controllerRef.current = null
      setIsControllerReady(false)
    }
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [handleTooltipStateChange, normalizedData.isAuctionInProgress])

  // Push updates into data chart controller
  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) {
      return
    }

    controller.update({
      data: normalizedData.data,
      scaledYMin: normalizedData.scaledYMin,
      scaledYMax: normalizedData.scaledYMax,
      scaleFactor: normalizedData.scaleFactor,
      bidTokenSymbol: bidTokenInfo.symbol,
      maxFractionDigits,
      timeSpanDays: normalizedData.timeSpanDays,
      visibleRangeStart: normalizedData.visibleRangeStart,
      visibleRangeEnd: normalizedData.visibleRangeEnd,
      fullRangeStart: normalizedData.startTime,
      fullRangeEnd: normalizedData.endTime,
      initialRangeStart: normalizedData.visibleRangeStart,
      initialRangeEnd: normalizedData.visibleRangeEnd,
      tokenColor,
      // For two-chart mode, the data chart renders at 100% of its container (no 75% logical range needed)
      useLogicalRangePositioning: false,
      // Hide x-axis on data chart when using two-chart overlay mode (x-axis chart provides it)
      hideXAxis: normalizedData.isAuctionInProgress,
      isZoomEnabled: !normalizedData.isAuctionInProgress,
      disableMouseWheelInteractions,
      preBidEndTime: normalizedData.preBidEndTime,
    })

    const coords = controllerRef.current?.getLastPointCoordinates()
    setLastPointCoords(coords ?? null)
  }, [normalizedData, bidTokenInfo.symbol, maxFractionDigits, tokenColor, disableMouseWheelInteractions])

  useEffect(() => {
    if (!normalizedData.isAuctionInProgress || !xAxisChartRef.current) {
      return
    }

    const xAxisChart = xAxisChartRef.current
    // Wrap in try-catch to handle the case where the chart isn't ready yet
    // (e.g., no data has been set). This can happen during initialization
    // when the zoom state effect runs before the x-axis chart lifecycle effect.
    try {
      if (clearingPriceZoomState.isZoomed && clearingPriceZoomState.visibleRange) {
        xAxisChart.timeScale().setVisibleRange({
          from: clearingPriceZoomState.visibleRange.from as UTCTimestamp,
          to: clearingPriceZoomState.visibleRange.to as UTCTimestamp,
        })
      } else {
        xAxisChart.timeScale().fitContent()
      }
    } catch {
      // Chart not ready yet - ignore the error, the range will be set
      // when the chart is properly initialized with data
    }
  }, [clearingPriceZoomState, normalizedData.isAuctionInProgress])

  useEffect(() => {
    // When embedded in the combined chart, the parent handles zoom commands
    if (disableMouseWheelInteractions) {
      return
    }
    if (!chartZoomCommand || chartZoomCommand.target !== 'clearingPrice') {
      return
    }
    const controller = controllerRef.current
    if (!controller) {
      return
    }

    if (chartZoomCommand.action === 'zoomIn') {
      controller.zoomIn()
    } else if (chartZoomCommand.action === 'zoomOut') {
      controller.zoomOut()
    } else {
      controller.resetToInitialRange()
    }

    // Clear the command after execution to prevent re-execution on re-renders
    clearChartZoomCommand()
  }, [chartZoomCommand, clearChartZoomCommand, disableMouseWheelInteractions])

  // Tooltip placement dynamically changes to avoid overflowing chart
  const tooltipTransform = tooltipState ? calculateTooltipTransform(tooltipState) : undefined

  // Create stable data key for LiveDotRenderer to track data changes
  const dataKey =
    normalizedData.data.length > 0
      ? `${normalizedData.data[normalizedData.data.length - 1]?.time}:${normalizedData.data[normalizedData.data.length - 1]?.value}`
      : undefined

  // Determine if hovering (for LiveDotRenderer to hide while hovering)
  const isHovering = tooltipState !== null

  // For in-progress auctions, use two-chart layout
  if (normalizedData.isAuctionInProgress) {
    return (
      <Flex width="100%" height={height}>
        <ChartWrapper height={height}>
          {yAxisLabels.map((tick) => (
            <YAxisLabelEl key={tick.y} style={{ top: tick.y }}>
              {tick.label}
            </YAxisLabelEl>
          ))}
          {/* Background: X-axis chart showing full auction time range */}
          <XAxisChartContainer ref={xAxisChartContainerRef} height={height} />
          {/* Foreground: Data chart showing actual price data */}
          <DataChartContainer ref={chartContainerRef} height={height - 15} $widthPercent={dataChartWidthPercent} />
          <Flex
            position="absolute"
            top={0}
            left={0}
            pointerEvents="none"
            zIndex={10}
            opacity={tooltipState !== null ? 1 : 0}
            style={{
              transition: 'opacity 0.15s ease-out',
              ...(tooltipTransform ? { transform: tooltipTransform } : undefined),
            }}
          >
            <TooltipContainer position="relative" py="$spacing8" px="$spacing12">
              {tooltipState && (
                <ClearingPriceTooltipBody
                  data={tooltipState.data}
                  bidTokenInfo={bidTokenInfo}
                  scaleFactor={normalizedData.scaleFactor}
                  totalSupply={totalSupply}
                  auctionTokenDecimals={auctionTokenDecimals}
                  isPreBidEnd={tooltipState.isPreBidEnd}
                />
              )}
            </TooltipContainer>
          </Flex>
          {/* Live dot indicator — wrapper offsets by CHART_DIMENSIONS.Y_AXIS_LABEL_WIDTH to match DataChartContainer position */}
          {chartContainerRef.current && isControllerReady && controllerRef.current && (
            <Flex
              style={{
                position: 'absolute',
                top: 0,
                left: CHART_DIMENSIONS.Y_AXIS_LABEL_WIDTH,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
              }}
            >
              <LiveDotRenderer
                chartModel={controllerRef.current}
                isHovering={isHovering}
                hoverCoordinates={hoverCoordinates}
                chartContainer={chartContainerRef.current}
                overrideColor={tokenColor}
                dataKey={dataKey}
                coordinateOverride={lastPointCoords}
              />
            </Flex>
          )}
        </ChartWrapper>
      </Flex>
    )
  }

  // For ended auctions, use single chart layout
  return (
    <Flex width="100%" height={height}>
      <ChartWrapper height={height}>
        {yAxisLabels.map((tick) => (
          <YAxisLabelEl key={tick.y} style={{ top: tick.y }}>
            {tick.label}
          </YAxisLabelEl>
        ))}
        <ChartContainer ref={chartContainerRef} height={height} />
        <Flex
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 10,
            opacity: tooltipState !== null ? 1 : 0,
            transition: 'opacity 0.15s ease-out',
            ...(tooltipTransform ? { transform: tooltipTransform } : undefined),
          }}
        >
          <TooltipContainer position="relative" py="$spacing8" px="$spacing12">
            {tooltipState && (
              <ClearingPriceTooltipBody
                data={tooltipState.data}
                bidTokenInfo={bidTokenInfo}
                scaleFactor={normalizedData.scaleFactor}
                totalSupply={totalSupply}
                auctionTokenDecimals={auctionTokenDecimals}
                isPreBidEnd={tooltipState.isPreBidEnd}
              />
            )}
          </TooltipContainer>
        </Flex>
      </ChartWrapper>
    </Flex>
  )
}
