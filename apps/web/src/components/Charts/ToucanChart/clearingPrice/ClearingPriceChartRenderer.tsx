import { createChart, type IChartApi, type UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { useEvent } from 'utilities/src/react/hooks'
import { LiveDotRenderer } from '~/components/Charts/LiveDotRenderer'
import { ClearingPriceTooltipBody } from '~/components/Charts/ToucanChart/clearingPrice/components/ClearingPriceTooltipBody'
import { createTimeScaleOptions } from '~/components/Charts/ToucanChart/clearingPrice/controller/chartOptions'
import { calculateTooltipTransform } from '~/components/Charts/ToucanChart/clearingPrice/controller/logic/crosshairMove'
import { ToucanClearingPriceChartController } from '~/components/Charts/ToucanChart/clearingPrice/ToucanClearingPriceChartController'
import type {
  ChartCoordinates,
  ClearingPriceTooltipState,
  NormalizedClearingPriceSeries,
} from '~/components/Charts/ToucanChart/clearingPrice/types'
import { formatTickMarks } from '~/components/Charts/utils'
import { CHART_DIMENSIONS } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import type { BidTokenInfo, ChartZoomState } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'
import { deprecatedStyled } from '~/lib/deprecated-styled'

/**
 * For in-progress auctions, the data chart occupies this percentage of the total width.
 * The remaining space shows blank x-axis indicating more auction time remains.
 */
const IN_PROGRESS_DATA_WIDTH_PERCENT = 75

const ChartContainer = deprecatedStyled.div<{ height: number }>`
  width: 100%;
  height: 100%;

  /* Override lightweight-charts inline overflow:hidden to prevent x-axis label cutoff */
  .tv-lightweight-charts {
    padding-top: 10px;
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

  /* Shift y-axis canvas closer to the chart */
  .tv-lightweight-charts td:first-child canvas {
    left: 5px !important;
    top: -5px !important;
  }
`

const ChartWrapper = deprecatedStyled.div<{ height: number }>`
  position: relative;
  width: 100%;
  height: ${({ height }) => height}px;
  overflow: visible;
`

const TooltipContainer = deprecatedStyled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
  background-color: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 8px;
  padding: 8px 12px;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transition: opacity 0.15s ease-out;
  box-shadow: ${({ theme }) =>
    theme.darkMode
      ? '0px 1px 3px 0px rgba(0, 0, 0, 0.12), 0px 1px 2px 0px rgba(0, 0, 0, 0.24)'
      : '0px 1px 6px 2px rgba(0, 0, 0, 0.03), 0px 1px 2px 0px rgba(0, 0, 0, 0.02)'};
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
    padding-top: 10px;
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
  left: 0;
  width: ${({ $widthPercent }) => $widthPercent}%;
  height: ${({ height }) => height}px;
  overflow: hidden;

  .tv-lightweight-charts {
    padding-top: 10px;
    overflow: hidden !important;
  }

  /* Shift y-axis canvas closer to the chart */
  .tv-lightweight-charts td:first-child canvas {
    left: 5px !important;
    top: -5px !important;
  }
`

interface ClearingPriceChartRendererProps {
  normalizedData: NormalizedClearingPriceSeries
  bidTokenInfo: BidTokenInfo
  maxFractionDigits: number
  tokenColor?: string
  height?: number
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
}: ClearingPriceChartRendererProps): JSX.Element {
  const colors = useSporeColors()
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const xAxisChartContainerRef = useRef<HTMLDivElement | null>(null)
  const xAxisChartRef = useRef<IChartApi | null>(null)
  const controllerRef = useRef<ToucanClearingPriceChartController | null>(null)

  const [tooltipState, setTooltipState] = useState<ClearingPriceTooltipState | null>(null)
  const [hoverCoordinates, setHoverCoordinates] = useState<ChartCoordinates | null>(null)
  const [isControllerReady, setIsControllerReady] = useState(false)
  const { chartZoomCommand, clearingPriceZoomState } = useAuctionStore((state) => ({
    chartZoomCommand: state.chartZoomCommand,
    clearingPriceZoomState: state.clearingPriceZoomState,
  }))
  const { setClearingPriceZoomState, clearChartZoomCommand } = useAuctionStoreActions()

  // Total chart height includes extra height to fill the space where distribution chart's header row would be
  const effectiveHeight = height + CHART_DIMENSIONS.CLEARING_PRICE_EXTRA_HEIGHT

  const handleTooltipStateChange = useEvent((state: ClearingPriceTooltipState | null) => {
    setTooltipState(state)
  })
  const handleHoverCoordinatesChange = useEvent((coordinates: ChartCoordinates | null) => {
    setHoverCoordinates(coordinates)
  })
  const handleZoomStateChange = useEvent((state: ChartZoomState) => {
    setClearingPriceZoomState(state)
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: Using specific properties from normalizedData in deps is intentional
  useEffect(() => {
    if (!normalizedData.isAuctionInProgress || !xAxisChartContainerRef.current) {
      return undefined
    }

    // Destroy existing x-axis chart
    xAxisChartRef.current?.remove()

    const container = xAxisChartContainerRef.current
    const xAxisChart = createChart(container, {
      width: container.clientWidth,
      height: effectiveHeight,
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
    effectiveHeight,
    colors,
  ])

  // Data chart controller lifecycle
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally exclude most props from deps to prevent recreation. Updates flow through controller.update() instead.
  useEffect(() => {
    if (!chartContainerRef.current) {
      return undefined
    }

    // Destroy existing controller if any (for strict mode double-mount)
    controllerRef.current?.destroy()

    controllerRef.current = new ToucanClearingPriceChartController({
      container: chartContainerRef.current,
      height: effectiveHeight,
      colors,
      tokenColor,
      bidTokenInfo,
      maxFractionDigits,
      callbacks: {
        onTooltipStateChange: handleTooltipStateChange,
        onHoverCoordinatesChange: handleHoverCoordinatesChange,
        onZoomStateChange: handleZoomStateChange,
      },
    })
    setIsControllerReady(true)

    return () => {
      controllerRef.current?.destroy()
      controllerRef.current = null
      setIsControllerReady(false)
    }
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
    })
  }, [normalizedData, bidTokenInfo.symbol, maxFractionDigits, tokenColor])

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
  }, [chartZoomCommand, clearChartZoomCommand])

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
      <Flex width="100%" height={effectiveHeight}>
        <ChartWrapper height={effectiveHeight}>
          {/* Background: X-axis chart showing full auction time range */}
          <XAxisChartContainer ref={xAxisChartContainerRef} height={effectiveHeight} />
          {/* Foreground: Data chart showing actual price data */}
          <DataChartContainer
            ref={chartContainerRef}
            height={effectiveHeight - 15}
            $widthPercent={dataChartWidthPercent}
          />
          <TooltipContainer
            $isVisible={tooltipState !== null}
            style={tooltipTransform ? { transform: tooltipTransform } : undefined}
          >
            {tooltipState && (
              <ClearingPriceTooltipBody
                data={tooltipState.data}
                bidTokenInfo={bidTokenInfo}
                maxFractionDigits={maxFractionDigits}
                scaleFactor={normalizedData.scaleFactor}
              />
            )}
          </TooltipContainer>
          {/* Live dot indicator */}
          {chartContainerRef.current && isControllerReady && controllerRef.current && (
            <LiveDotRenderer
              chartModel={controllerRef.current}
              isHovering={isHovering}
              hoverCoordinates={hoverCoordinates}
              chartContainer={chartContainerRef.current}
              overrideColor={tokenColor}
              dataKey={dataKey}
            />
          )}
        </ChartWrapper>
      </Flex>
    )
  }

  // For ended auctions, use single chart layout
  return (
    <Flex width="100%" height={effectiveHeight}>
      <ChartWrapper height={200}>
        <ChartContainer ref={chartContainerRef} height={effectiveHeight} />
        <TooltipContainer
          $isVisible={tooltipState !== null}
          style={tooltipTransform ? { transform: tooltipTransform } : undefined}
        >
          {tooltipState && (
            <ClearingPriceTooltipBody
              data={tooltipState.data}
              bidTokenInfo={bidTokenInfo}
              maxFractionDigits={maxFractionDigits}
              scaleFactor={normalizedData.scaleFactor}
            />
          )}
        </TooltipContainer>
      </ChartWrapper>
    </Flex>
  )
}
