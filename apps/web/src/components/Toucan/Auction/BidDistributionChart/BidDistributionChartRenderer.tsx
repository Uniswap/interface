/* eslint-disable max-lines */
import { ToucanChartData } from 'components/Charts/ToucanChart/renderer'
import { ToucanChartSeries } from 'components/Charts/ToucanChart/toucan-chart-series'
import { BidDistributionChartPlaceholder } from 'components/Toucan/Auction/BidDistributionChart/BidDistributionChartPlaceholder'
import {
  CHART_PADDING,
  CHART_SCALE_MARGINS,
  COORDINATE_SCALING,
  LABEL_CONFIG,
  ZOOM_DEFAULTS,
  ZOOM_TOLERANCE,
} from 'components/Toucan/Auction/BidDistributionChart/constants'
import { useChartDimensions } from 'components/Toucan/Auction/BidDistributionChart/hooks/useChartDimensions'
import { useChartLabels } from 'components/Toucan/Auction/BidDistributionChart/hooks/useChartLabels'
import { useChartTooltip } from 'components/Toucan/Auction/BidDistributionChart/hooks/useChartTooltip'
import { BidConcentrationResult } from 'components/Toucan/Auction/BidDistributionChart/utils/bidConcentration'
import { formatClearingPriceLabel } from 'components/Toucan/Auction/BidDistributionChart/utils/clearingPrice/label'
import {
  calculateInitialVisibleRange,
  generateChartData,
} from 'components/Toucan/Auction/BidDistributionChart/utils/utils'
import {
  AuctionProgressState,
  BidDistributionData,
  BidTokenInfo,
  DisplayMode,
} from 'components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from 'components/Toucan/Auction/store/useAuctionStore'
import { deprecatedStyled } from 'lib/styled-components'
import { ColorType, createChart, IChartApi, ISeriesApi, LineStyle, UTCTimestamp } from 'lightweight-charts'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { opacify } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { formatUnits } from 'viem'

const ChartContainer = deprecatedStyled.div<{ height: number }>`
  width: 100%;
  height: ${({ height }) => height}px;

  /* Add padding to lightweight-charts container to prevent top label cutoff */
  .tv-lightweight-charts {
    padding-top: 10px;
  }

  /* Shift y-axis canvas closer to the chart */
  .tv-lightweight-charts td:first-child canvas {
    left: 5px !important;
    top: -5px !important;
  }

  /* Prevent y-axis labels from being cut off */
  .tv-lightweight-charts td:first-child > div {
    overflow: visible !important;
  }
`

interface CrosshairMoveParams {
  point?: { x: number; y: number }
  time?: number | string
  seriesData: Map<ISeriesApi<'Custom'>, ToucanChartData>
}

/**
 * Creates chart configuration options
 * Extracted as a pure function for testability
 */
function createChartOptions(params: {
  width: number
  height: number
  colors: UseSporeColorsReturn
  priceFormatter: (price: number) => string
}) {
  const { width, height, colors, priceFormatter } = params
  return {
    width,
    height,
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: colors.neutral2.val,
      fontSize: 10,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: colors.surface3Solid.val, style: LineStyle.SparseDotted },
    },
    leftPriceScale: {
      visible: true,
      borderVisible: false, // Hide y-axis border
      textColor: colors.neutral2.val,
      minimumWidth: 40, // Reduce left padding by setting a smaller minimum width for the y-axis
    },
    rightPriceScale: {
      visible: false,
    },
    timeScale: {
      visible: true,
      borderVisible: true, // Show border (left line) as solid
      borderColor: colors.surface3Solid.val, // Same color as grid lines
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
        labelVisible: true,
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

interface BidDistributionChartRendererProps {
  bidData: BidDistributionData
  bidTokenInfo: BidTokenInfo
  displayMode: DisplayMode
  totalSupply?: string
  auctionTokenDecimals?: number
  clearingPrice: string
  tickSize: string
  tokenColor?: string
  height?: number
  preCalculatedConcentration: BidConcentrationResult | null
}

export function BidDistributionChartRenderer({
  bidData,
  bidTokenInfo,
  displayMode,
  totalSupply,
  auctionTokenDecimals = 18,
  clearingPrice,
  tickSize,
  tokenColor,
  height = 400,
  preCalculatedConcentration,
}: BidDistributionChartRendererProps) {
  const auctionState = useAuctionStore((state) => state.progress.state)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Custom'> | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const labelsLayerRef = useRef<HTMLDivElement | null>(null)
  const shouldAnimateRef = useRef<boolean>(false)

  const colors = useSporeColors()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // Get zoom state and actions from store
  const chartZoomState = useAuctionStore((state) => state.chartZoomState)
  const { setChartZoomState } = useAuctionStoreActions()

  // Y-axis formatter: Uses localization with currency symbol for bid amounts
  const formatYAxisLabel = useCallback(
    (amount: number): string => {
      return convertFiatAmountFormatted(amount, NumberType.FiatTokenStats)
    },
    [convertFiatAmountFormatted],
  )

  // X-axis formatter: No currency symbol, removes trailing zeros (e.g., $1.00 → 1, $1.50 → 1.5)
  const formatXAxisLabel = useCallback(
    (amount: number): string => {
      // Use localization but without currency
      const formatted = convertFiatAmountFormatted(amount, NumberType.FiatTokenStats)

      // Extract just the numeric part by removing non-numeric characters except . and ,
      const numericPart = formatted.replace(/[^\d.,\s]/g, '').trim()

      // Parse and re-format to remove unnecessary trailing zeros
      const num = parseFloat(numericPart.replace(/,/g, ''))
      if (isNaN(num)) {
        return numericPart
      }

      // Format with minimal decimal places, removing trailing zeros
      return num.toString()
    },
    [convertFiatAmountFormatted],
  )

  // Tooltip formatter: Includes currency symbol and K/M/B suffixes
  const formatTooltipLabel = useCallback(
    (amount: number): string => {
      // For tokenPrice mode: show currency symbol (e.g., $1.50)
      // For valuation mode: show with K/M/B suffix (e.g., $1.5M)
      return convertFiatAmountFormatted(amount, NumberType.FiatTokenStats)
    },
    [convertFiatAmountFormatted],
  )

  // Convert tick size to decimal for use throughout component
  const tickSizeDecimal = useMemo(
    () => Number(formatUnits(BigInt(tickSize), bidTokenInfo.decimals)),
    [tickSize, bidTokenInfo.decimals],
  )

  // Convert clearing price to decimal
  const clearingPriceDecimal = useMemo(
    () => Number(formatUnits(BigInt(clearingPrice), bidTokenInfo.decimals)),
    [clearingPrice, bidTokenInfo.decimals],
  )

  // Generate chart data (uses X-axis formatter for tick display strings)
  // TODO | Toucan - Performance: generateChartData calculates concentration internally but we
  // immediately override it with preCalculatedConcentration. Consider adding a skipConcentration
  // flag to generateChartData to avoid duplicate sliding-window calculation.
  const { bars, minTick, maxTick, labelIncrement, concentration } = useMemo(() => {
    const chartData = generateChartData({
      bidData,
      bidTokenInfo,
      displayMode,
      totalSupply,
      auctionTokenDecimals,
      clearingPrice,
      tickSize,
      formatter: formatXAxisLabel,
    })

    // Always use pre-calculated concentration from parent to ensure indices match across components
    return { ...chartData, concentration: preCalculatedConcentration }
  }, [
    bidData,
    bidTokenInfo,
    displayMode,
    totalSupply,
    auctionTokenDecimals,
    clearingPrice,
    tickSize,
    formatXAxisLabel,
    preCalculatedConcentration,
  ])

  const { getPlotDimensions } = useChartDimensions()
  const { renderLabels } = useChartLabels({
    minTick,
    maxTick,
    labelIncrement,
    tickSize: tickSizeDecimal,
    displayMode,
    bidTokenInfo,
    totalSupply,
    auctionTokenDecimals,
    formatter: formatXAxisLabel,
    colors,
  })
  const { createTooltipElement, formatTooltipText } = useChartTooltip({
    displayMode,
    bidTokenInfo,
    totalSupply,
    auctionTokenDecimals,
    formatter: formatTooltipLabel,
    volumeFormatter: formatYAxisLabel, // Use Y-axis formatter for volume (bid amounts)
    colors,
  })

  // Store min/max time for axis calculations
  const minTimeRef = useRef<number | null>(null)
  const maxTimeRef = useRef<number | null>(null)

  /**
   * Creates the labels layer DOM element
   */
  const createLabelsLayer = useCallback((): HTMLDivElement => {
    const labelsLayer = document.createElement('div')
    Object.assign(labelsLayer.style, {
      position: 'absolute',
      left: '0',
      bottom: `${LABEL_CONFIG.BOTTOM_POSITION}px`,
      width: '100%',
      height: `${LABEL_CONFIG.HEIGHT}px`,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'stretch',
      overflow: 'hidden', // Clip labels at plot area boundaries
    })
    return labelsLayer
  }, [])

  /**
   * Updates custom labels when chart changes
   */
  const updateCustomLabels = useCallback(() => {
    if (!labelsLayerRef.current || !chartRef.current) {
      return
    }

    // Update labels layer dimensions to match plot area (prevents label overflow)
    const plotDimensions = getPlotDimensions(chartContainerRef.current, chartRef.current)
    labelsLayerRef.current.style.left = `${plotDimensions.left}px`
    labelsLayerRef.current.style.width = `${plotDimensions.width}px`

    // Since labels layer now starts at plotLeft, individual labels should be positioned
    // relative to the layer (at x) rather than relative to the container (x + plotLeft)
    renderLabels({ labelsLayer: labelsLayerRef.current, chart: chartRef.current, plotLeft: 0 })
  }, [getPlotDimensions, renderLabels])

  /**
   * Formats the clearing price label for display on the chart
   * Uses tooltip formatter to include currency symbols and FDV suffix
   */
  const clearingPriceLabel = useMemo(() => {
    return formatClearingPriceLabel({
      clearingPrice: clearingPriceDecimal,
      displayMode,
      bidTokenInfo,
      totalSupply,
      auctionTokenDecimals,
      formatter: formatTooltipLabel,
    })
  }, [clearingPriceDecimal, displayMode, bidTokenInfo, totalSupply, auctionTokenDecimals, formatTooltipLabel])

  /**
   * Converts bars to histogram data format
   */
  const histogramData = useMemo((): ToucanChartData[] => {
    return bars.map((bar) => ({
      time: Math.round(bar.tick * COORDINATE_SCALING.PRICE_SCALE_FACTOR) as UTCTimestamp,
      value: bar.amount,
      tickValue: bar.tick, // Store original tick value for color comparison
    }))
  }, [bars])

  // TODO | Toucan -- this useEffect has too many responsibilities
  // Once final functionality is decided on, refactor to smaller single responsibility code blocks
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only include dependencies that should cause a full chart recreation.
  useEffect(() => {
    if (!chartContainerRef.current) {
      return undefined
    }

    let chart: IChartApi
    try {
      const chartOptions = createChartOptions({
        width: chartContainerRef.current.clientWidth,
        height,
        colors,
        priceFormatter: formatYAxisLabel,
      })
      chart = createChart(chartContainerRef.current, chartOptions)
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'BidDistributionChartRenderer',
          function: 'BidDistributionChartRenderer',
        },
      })
      return () => {
        // Ensure animation is stopped even if chart creation failed
        shouldAnimateRef.current = false
      }
    }

    // Prepare bar colors with tokenColor or fallback to colors.accent1.val
    const effectiveTokenColor = tokenColor || colors.accent1.val
    const barColors = {
      clearingPriceColor: effectiveTokenColor,
      aboveClearingPriceColor: opacify(40, effectiveTokenColor),
      belowClearingPriceColor: colors.neutral3.val,
    }

    // Prepare label colors for clearing price label (supports light/dark themes)
    const labelColors = {
      background: colors.surface2.val,
      border: colors.surface3.val,
      text: colors.neutral1.val,
    }

    // Prepare label styles for clearing price label
    // Note: Canvas rendering requires a CSS font-family string. The theme only provides
    // `fonts.code` for monospace, but we need the default system font stack for UI text.
    // This matches the standard web font fallback stack used throughout the app.
    const labelStyles = {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }

    // Create custom series with concentration band info and clearing price label
    const customSeries = chart.addCustomSeries(
      new ToucanChartSeries({
        barColors,
        labelColors,
        labelStyles,
        clearingPrice: clearingPriceDecimal,
        tickSize: tickSizeDecimal,
        concentrationBand: concentration
          ? {
              startIndex: concentration.startIndex,
              endIndex: concentration.endIndex,
              startTick: concentration.startTick,
              endTick: concentration.endTick,
            }
          : null,
        clearingPriceLabel,
      }),
      {
        priceScaleId: 'left',
        priceLineVisible: false, // Hide the default price line
        lastValueVisible: false, // Hide the last value label
      },
    )

    customSeries.setData(histogramData)

    // Store min/max price (in scaled coordinate units) for axis range calculations
    // Note: Using 'time' terminology due to lightweight-charts API, but these represent prices
    if (histogramData.length > 0) {
      minTimeRef.current = histogramData[0].time
      maxTimeRef.current = histogramData[histogramData.length - 1].time
    }

    // Create and append labels layer
    const labelsLayer = createLabelsLayer()
    chartContainerRef.current.appendChild(labelsLayer)
    labelsLayerRef.current = labelsLayer

    // Create and append tooltip
    const tooltip = createTooltipElement()
    chartContainerRef.current.style.position = 'relative'
    chartContainerRef.current.appendChild(tooltip)
    tooltipRef.current = tooltip

    // TODO | Toucan - extract crosshair to separate function
    // Crosshair handler for tooltip
    const crosshairHandler = (param: unknown) => {
      if (!tooltipRef.current) {
        return
      }
      const tooltip = tooltipRef.current

      // Type guard to ensure param has expected structure
      if (!param || typeof param !== 'object') {
        tooltip.style.display = 'none'
        return
      }

      const typedParam = param as CrosshairMoveParams
      const point = typedParam.point

      if (!point || !typedParam.time) {
        tooltip.style.display = 'none'
        return
      }

      const data = typedParam.seriesData.get(customSeries)
      if (!data) {
        tooltip.style.display = 'none'
        return
      }

      // Convert time (scaled units) back to price value and format
      const tickValue = Number(data.time) / COORDINATE_SCALING.PRICE_SCALE_FACTOR
      const volumeAmount = data.value // Bid volume in USD

      // Hide horizontal crosshair line (y-axis indicator) for zero values
      chart.applyOptions({
        crosshair: {
          horzLine: {
            labelVisible: volumeAmount > 0,
          },
        },
      })

      tooltip.textContent = formatTooltipText(tickValue, volumeAmount)

      // Calculate tooltip position with edge detection
      if (!chartContainerRef.current) {
        return
      }

      const containerRect = chartContainerRef.current.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()

      // Adjust horizontal position if tooltip would be cut off
      let adjustedX = point.x
      const halfTooltipWidth = tooltipRect.width / 2

      if (point.x + halfTooltipWidth > containerRect.width) {
        // Too close to right edge
        adjustedX = containerRect.width - halfTooltipWidth
      } else if (point.x - halfTooltipWidth < 0) {
        // Too close to left edge
        adjustedX = halfTooltipWidth
      }

      // Adjust vertical position if tooltip would be cut off
      let adjustedY = point.y
      const tooltipHeight = tooltipRect.height

      if (point.y - tooltipHeight < 0) {
        // Too close to top edge
        adjustedY = tooltipHeight
      } else if (point.y > containerRect.height) {
        // Too close to bottom edge
        adjustedY = containerRect.height
      }

      tooltip.style.left = `${adjustedX}px`
      tooltip.style.top = `${adjustedY}px`
      tooltip.style.display = 'block'
    }
    chart.subscribeCrosshairMove(crosshairHandler)

    // Configure Y-axis (bid amounts in USD)
    // Note: In lightweight-charts, priceScale() always controls the Y-axis
    chart.priceScale('left').applyOptions({
      scaleMargins: {
        top: CHART_SCALE_MARGINS.TOP,
        bottom: CHART_SCALE_MARGINS.BOTTOM,
      },
      autoScale: true, // Automatically scale to fit data
    })

    // Configure X-axis visible range (token prices in scaled coordinate units)
    // Note: In lightweight-charts, timeScale() always controls the X-axis, even though
    // we're displaying prices (not time). This is a library architecture constraint.

    // Calculate initial visible range: clearing price + INITIAL_TICK_COUNT ticks
    const initialRange = calculateInitialVisibleRange({
      clearingPrice: clearingPriceDecimal,
      minTick,
      maxTick,
      tickSize: tickSizeDecimal,
      initialTickCount: ZOOM_DEFAULTS.INITIAL_TICK_COUNT,
    })

    // Convert initial range to scaled coordinates
    const initialFromScaled = Math.round(initialRange.from * COORDINATE_SCALING.PRICE_SCALE_FACTOR) as UTCTimestamp
    const initialToScaled = Math.round(initialRange.to * COORDINATE_SCALING.PRICE_SCALE_FACTOR) as UTCTimestamp

    // Apply stored zoom state if it exists, otherwise use initial range
    // TODO | Toucan - determine if zoom should be reset in certain cases (like when new data comes in, or always retain saved zoom level)
    if (chartZoomState.visibleRange && minTimeRef.current !== null && maxTimeRef.current !== null) {
      // Use stored zoom state
      chart.timeScale().setVisibleRange({
        from: chartZoomState.visibleRange.from as UTCTimestamp,
        to: chartZoomState.visibleRange.to as UTCTimestamp,
      })
    } else if (minTimeRef.current !== null && maxTimeRef.current !== null) {
      // Use initial calculated range
      chart.timeScale().setVisibleRange({
        from: initialFromScaled,
        to: initialToScaled,
      })
    }

    // Initial render of labels (defer to next frame to ensure chart is fully laid out)
    requestAnimationFrame(() => {
      updateCustomLabels()
    })

    chartRef.current = chart
    seriesRef.current = customSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
        updateCustomLabels()
      }
    }

    // Subscribe to range changes for label updates
    const visibleRangeHandler = () => updateCustomLabels()
    chart.timeScale().subscribeVisibleTimeRangeChange(visibleRangeHandler)
    const logicalRangeHandler = () => updateCustomLabels()
    chart.timeScale().subscribeVisibleLogicalRangeChange(logicalRangeHandler)

    // Subscribe to visible range changes for zoom state tracking
    const zoomStateHandler = () => {
      const currentRange = chart.timeScale().getVisibleRange()
      if (!currentRange || minTimeRef.current === null || maxTimeRef.current === null) {
        return
      }

      let from = currentRange.from as number
      let to = currentRange.to as number

      // Calculate the full data range with padding (what "reset zoom" would show)
      const fullFrom = minTimeRef.current - CHART_PADDING.RANGE_PAD_UNITS
      const fullTo = maxTimeRef.current + CHART_PADDING.RANGE_PAD_UNITS
      const currentRangeSize = to - from

      // Constrain visible range to data boundaries
      // Don't allow scrolling past the min/max - the edges must stay at or beyond the data bounds
      let needsCorrection = false

      // If trying to scroll left past the minimum
      if (from < fullFrom) {
        from = fullFrom
        to = from + currentRangeSize
        needsCorrection = true
      }

      // If trying to scroll right past the maximum
      if (to > fullTo) {
        to = fullTo
        from = to - currentRangeSize
        needsCorrection = true
      }

      // Double-check: if the range is now too large (showing more than full data), clamp it
      if (from < fullFrom) {
        from = fullFrom
        needsCorrection = true
      }

      // If we had to correct the range, apply it
      if (needsCorrection) {
        chart.timeScale().setVisibleRange({
          from: from as UTCTimestamp,
          to: to as UTCTimestamp,
        })
        return // Will trigger another call with corrected range
      }

      // Calculate the range of the full data
      const fullRange = fullTo - fullFrom

      // Determine if user is zoomed in (current range is significantly smaller than full range)
      // Or if the visible range doesn't match the full range
      const isZoomedIn =
        Math.abs(from - fullFrom) > fullRange * ZOOM_TOLERANCE ||
        Math.abs(to - fullTo) > fullRange * ZOOM_TOLERANCE ||
        Math.abs(currentRangeSize - fullRange) > fullRange * ZOOM_TOLERANCE

      // Update store with new zoom state
      setChartZoomState({
        visibleRange: { from, to },
        isZoomed: isZoomedIn,
      })
    }
    chart.timeScale().subscribeVisibleTimeRangeChange(zoomStateHandler)

    window.addEventListener('resize', handleResize)

    // Animation loop for clearing price stripes
    let animationFrameId: number | null = null
    shouldAnimateRef.current = true

    const animate = () => {
      // Check if animation should continue
      if (!shouldAnimateRef.current) {
        animationFrameId = null
        return
      }

      if (chartRef.current && seriesRef.current) {
        // Trigger redraw by updating the series
        customSeries.applyOptions({})
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    // Start animation
    animationFrameId = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      // Signal animation to stop
      shouldAnimateRef.current = false

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }

      window.removeEventListener('resize', handleResize)
      chart.timeScale().unsubscribeVisibleTimeRangeChange(visibleRangeHandler)
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(logicalRangeHandler)
      chart.timeScale().unsubscribeVisibleTimeRangeChange(zoomStateHandler)
      chart.unsubscribeCrosshairMove(crosshairHandler)

      if (tooltipRef.current && chartContainerRef.current?.contains(tooltipRef.current)) {
        chartContainerRef.current.removeChild(tooltipRef.current)
        tooltipRef.current = null
      }

      if (labelsLayerRef.current && chartContainerRef.current?.contains(labelsLayerRef.current)) {
        chartContainerRef.current.removeChild(labelsLayerRef.current)
        labelsLayerRef.current = null
      }

      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [
    height,
    tokenColor,
    histogramData,
    concentration,
    clearingPriceDecimal,
    tickSizeDecimal,
    formatYAxisLabel,
    createTooltipElement,
    formatTooltipText,
    createLabelsLayer,
    updateCustomLabels,
    colors.neutral2.val,
    colors.neutral3.val,
    colors.surface3Solid.val,
    colors.accent1.val,
    clearingPriceLabel,
  ])

  // Handle zoom reset: when user clicks reset button, show full data range
  useEffect(() => {
    if (!chartRef.current || minTimeRef.current === null || maxTimeRef.current === null) {
      return
    }

    // If zoom state is reset (visibleRange is null and isZoomed is false),
    // and we're not in the initial render, apply full data range
    if (!chartZoomState.isZoomed && chartZoomState.visibleRange === null) {
      // Apply full data range with padding
      chartRef.current.timeScale().setVisibleRange({
        from: (minTimeRef.current - CHART_PADDING.RANGE_PAD_UNITS) as UTCTimestamp,
        to: (maxTimeRef.current + CHART_PADDING.RANGE_PAD_UNITS) as UTCTimestamp,
      })
    }
  }, [chartZoomState.isZoomed, chartZoomState.visibleRange])

  // Show placeholder when auction hasn't started
  if (auctionState === AuctionProgressState.NOT_STARTED) {
    return <BidDistributionChartPlaceholder height={height} />
  }

  return (
    <Flex width="100%">
      <ChartContainer ref={chartContainerRef} height={height} />
    </Flex>
  )
}
