/* eslint-disable max-lines */
import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Flex, useMedia, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { EXTENSION_PADDING_TICKS } from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/overlays'
import { ToucanBidDistributionChartController } from '~/components/Charts/ToucanChart/bidDistribution/ToucanBidDistributionChartController'
import type {
  ToucanBidDistributionChartControllerUpdateParams,
  ToucanBidLineTooltipState,
  ToucanChartBarTooltipState,
  ToucanClearingPriceTooltipState,
} from '~/components/Charts/ToucanChart/bidDistribution/types'
import { calculatePriceScaleFactor } from '~/components/Charts/ToucanChart/bidDistribution/utils/priceScaleFactor'
import { calculateRangePaddingUnits } from '~/components/Charts/ToucanChart/bidDistribution/utils/visibleRange'
import type { ToucanChartData, ToucanChartSeriesOptions } from '~/components/Charts/ToucanChart/renderer'
import { createDemandBackgroundGradient } from '~/components/Charts/ToucanChart/utils/colors'
import { BidLineTooltip } from '~/components/Toucan/Auction/BidDistributionChart/BidLineTooltip'
import { ChartBarTooltip } from '~/components/Toucan/Auction/BidDistributionChart/ChartBarTooltip'
import { ClearingPriceTooltip } from '~/components/Toucan/Auction/BidDistributionChart/ClearingPriceTooltip'
import {
  BID_LINE,
  CHART_DIMENSIONS,
  CLEARING_PRICE_LINE,
  DEMAND_BACKGROUND_GAP_MAX_VISIBLE_TICKS,
  LABEL_CONFIG,
} from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { useChartDimensions } from '~/components/Toucan/Auction/BidDistributionChart/hooks/useChartDimensions'
import { useChartLabels } from '~/components/Toucan/Auction/BidDistributionChart/hooks/useChartLabels'
import { useTickGrouping } from '~/components/Toucan/Auction/BidDistributionChart/hooks/useTickGrouping'
import { useTooltipOverlapDetection } from '~/components/Toucan/Auction/BidDistributionChart/hooks/useTooltipOverlapDetection'
import { useToucanBidDistributionChartLabels } from '~/components/Toucan/Auction/BidDistributionChart/hooks/useToucanBidDistributionChartLabels'
import { BidMarkerOverlay } from '~/components/Toucan/Auction/BidDistributionChart/markers/BidMarkerOverlay'
import { useBidMarkerPositions } from '~/components/Toucan/Auction/BidDistributionChart/markers/useBidMarkerPositions'
import {
  areBidLineTooltipStatesEqual,
  areChartBarTooltipStatesEqual,
  areClearingPriceTooltipStatesEqual,
  areRendererPropsEqual,
  areUpdateParamsEqual,
  type BidDistributionChartRendererProps,
} from '~/components/Toucan/Auction/BidDistributionChart/utils/equality'
import { formatTokenVolume } from '~/components/Toucan/Auction/BidDistributionChart/utils/tokenFormatters'
import { useAuctionValueFormatters } from '~/components/Toucan/Auction/hooks/useAuctionValueFormatters'
import { AuctionProgressState, BidInfoTab } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'
import { deprecatedStyled } from '~/lib/deprecated-styled'

const ChartContainer = deprecatedStyled.div<{ height: number }>`
  width: 100%;
  height: 100%;

  /* Add padding to lightweight-charts container to prevent label cutoff */
  .tv-lightweight-charts {
    padding-top: 10px;
    padding-bottom: 37px;
    overflow: visible !important;
  }

  /* Shift y-axis canvas closer to the chart */
  .tv-lightweight-charts td:first-child canvas {
    left: 5px !important;
    top: -5px !important;
  }

  /* Prevent y-axis labels from being cut off */
  .tv-lightweight-charts td:first-child > div {
    overflow: visible !important;
    background-color: ${({ theme }) => theme.surface1} !important;
    z-index: 5;
    position: relative;
  }
`

const ChartWrapper = deprecatedStyled.div<{ height: number }>`
  position: relative;
  width: 100%;
  height: ${({ height }) => height}px;
  overflow: visible;
`

function BidDistributionChartRendererComponent({
  chartData,
  bidTokenInfo,
  totalSupply,
  auctionTokenDecimals = 18,
  clearingPrice,
  onchainClearingPrice,
  floorPrice,
  tickSize,
  tokenColor,
  height = CHART_DIMENSIONS.HEIGHT,
  userBids,
  connectedWalletAddress,
  chartMode = 'distribution',
}: BidDistributionChartRendererProps) {
  const colors = useSporeColors()
  const colorsForController = useMemo(() => colors, [colors])
  const media = useMedia()

  const targetMaxLabels = media.sm ? 4 : media.lg ? 6 : undefined
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { getPlotDimensions } = useChartDimensions()
  const { bidOutOfRangeLabel, fdvLabel } = useToucanBidDistributionChartLabels()

  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const controllerRef = useRef<ToucanBidDistributionChartController | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Custom'> | null>(null)
  const lastUpdateRef = useRef<ToucanBidDistributionChartControllerUpdateParams | null>(null)
  const pendingUpdateRef = useRef<ToucanBidDistributionChartControllerUpdateParams | null>(null)

  // Refs for tooltip overlap detection
  const bidLineTooltipRef = useRef<HTMLDivElement | null>(null)
  const clearingPriceTooltipRef = useRef<HTMLDivElement | null>(null)

  const [bidLineTooltipState, setBidLineTooltipState] = useState<ToucanBidLineTooltipState>({
    left: 0,
    top: 0,
    isVisible: false,
    volumeAtTick: 0,
    volumePercent: 0,
    flipLeft: false,
  })

  const [clearingPriceTooltipState, setClearingPriceTooltipState] = useState<ToucanClearingPriceTooltipState>({
    left: 0,
    top: 0,
    isVisible: false,
    clearingPriceDecimal: 0,
    volumeAtClearingPrice: 0,
    totalBidVolume: 0,
  })

  const [chartBarTooltipState, setChartBarTooltipState] = useState<ToucanChartBarTooltipState>({
    left: 0,
    top: 0,
    isVisible: false,
    tickValue: 0,
    volumeAmount: 0,
    totalVolume: 0,
  })

  // State to force tooltip stacking when clicking near clearing price
  const [clickedNearClearingPrice, setClickedNearClearingPrice] = useState(false)

  const {
    chartZoomState,
    chartHoverResetKey,
    auctionProgressState,
    activeBidFormTab,
    chartZoomCommand,
    customBidTick,
  } = useAuctionStore((state) => ({
    chartZoomState: state.chartZoomStates[chartMode],
    chartHoverResetKey: state.chartHoverResetKey,
    auctionProgressState: state.progress.state,
    activeBidFormTab: state.activeBidFormTab,
    chartZoomCommand: state.chartZoomCommand,
    customBidTick: state.customBidTick.tickValue,
  }))
  const chartHoverResetKeyRef = useRef<number>(chartHoverResetKey)
  const isAuctionEnded = auctionProgressState === AuctionProgressState.ENDED
  const isPlacingBid = activeBidFormTab === BidInfoTab.PLACE_A_BID
  const {
    setChartZoomState,
    setSelectedTickPrice,
    incrementChartHoverResetKey,
    clearChartZoomCommand,
    setCustomBidTick,
    setActiveBidFormTab,
  } = useAuctionStoreActions()

  const {
    groupTicksEnabled,
    tickGrouping,
    groupedBars,
    barsForMarkers,
    effectiveUserBidPriceDecimal,
    clearingPriceDecimal,
    clearingPriceBigInt,
    tickSizeDecimal,
    concentration,
  } = useTickGrouping({
    chartData,
    clearingPrice,
    tickSize,
    bidTokenDecimals: bidTokenInfo.decimals,
    auctionTokenDecimals,
    chartMode,
  })

  // Compute onchainClearingPriceBigInt for marker in-range detection
  const onchainClearingPriceBigInt = useMemo(() => {
    const priceToUse = onchainClearingPrice || clearingPrice
    try {
      return BigInt(priceToUse)
    } catch {
      return BigInt(0)
    }
  }, [onchainClearingPrice, clearingPrice])

  // Grouped mode should reset to the initial zoom policy (zoomConfig.ts) without overwriting the user's
  // persisted non-grouped zoom state. Keep a separate, local zoom state while grouped mode is active.
  const [groupedChartZoomState, setGroupedChartZoomState] = useState<typeof chartZoomState>({
    visibleRange: null,
    isZoomed: false,
  })
  const effectiveChartZoomState = groupTicksEnabled ? groupedChartZoomState : chartZoomState
  const isGroupedTicksRef = useRef<boolean>(groupTicksEnabled)
  useEffect(() => {
    isGroupedTicksRef.current = groupTicksEnabled
  }, [groupTicksEnabled])

  // Track previous hover reset key to detect when it changes
  const prevChartHoverResetKeyRef = useRef<number>(chartHoverResetKey)
  useEffect(() => {
    chartHoverResetKeyRef.current = chartHoverResetKey
  }, [chartHoverResetKey])

  const formatYAxisLabel = useCallback(
    (amount: number): string => {
      // Convert from USD back to token units for display
      // When priceFiat is 0 (unavailable), the amount is already in token units
      const tokenAmount = bidTokenInfo.priceFiat > 0 ? amount / bidTokenInfo.priceFiat : amount
      return formatTokenVolume(tokenAmount, { maxDecimals: 3 })
    },
    [bidTokenInfo.priceFiat],
  )

  const formatFdvValue = useCallback(
    (amount: number): string => convertFiatAmountFormatted(amount, NumberType.FiatTokenStats),
    [convertFiatAmountFormatted],
  )
  const formatYAxisLabelRef = useRef(formatYAxisLabel)
  const formatFdvValueRef = useRef(formatFdvValue)
  useEffect(() => {
    formatYAxisLabelRef.current = formatYAxisLabel
  }, [formatYAxisLabel])
  useEffect(() => {
    formatFdvValueRef.current = formatFdvValue
  }, [formatFdvValue])
  const formatYAxisLabelStable = useCallback((amount: number) => formatYAxisLabelRef.current(amount), [])
  const formatFdvValueStable = useCallback((amount: number) => formatFdvValueRef.current(amount), [])

  // Choose a coordinate scaling factor that keeps tick→integer mapping collision-free.
  const priceScaleFactor = useMemo(() => {
    return calculatePriceScaleFactor({
      tickSizeDecimal,
      minTick: chartData.minTick,
      maxTick: chartData.maxTick,
      clearingPriceDecimal,
    })
  }, [tickSizeDecimal, chartData.minTick, chartData.maxTick, clearingPriceDecimal])

  const rangePaddingUnits = useMemo(() => {
    return calculateRangePaddingUnits({ priceScaleFactor })
  }, [priceScaleFactor])

  // biome-ignore lint/correctness/useExhaustiveDependencies: chartHoverResetKey and isPlacingBid are included to force canvas redraws
  const histogramData = useMemo((): ToucanChartData[] => {
    // lightweight-charts uses `time` as the X axis. We encode ticks as integer "time" values by multiplying
    // by `priceScaleFactor` (to avoid collisions) and rounding. The bar height (`value`) is the Y axis.
    // Note: chartHoverResetKey is included as a dependency to force a new array reference when hover
    // state needs to be reset (e.g., when mouse leaves the chart). This triggers setData() with fresh
    // data, which resets lightweight-charts' internal cached options.
    // Note: isPlacingBid is included to force a redraw when switching tabs - the bid line is rendered
    // on the canvas, so we need to trigger setData() to clear it when not placing a bid.
    const sourceBars = chartMode === 'distribution' && groupTicksEnabled && groupedBars ? groupedBars : chartData.bars

    // Map bars to histogram data and merge volumes for duplicate time values.
    // Duplicate time values can occur when tick differences are smaller than 1/priceScaleFactor,
    // causing Math.round() to produce the same integer for different ticks.
    // Since these are distinct bids at different price points, we sum their volumes.
    const timeToData = new Map<number, ToucanChartData>()

    for (const bar of sourceBars) {
      const time = Math.round(bar.tick * priceScaleFactor)
      const existing = timeToData.get(time)
      if (existing) {
        existing.value += bar.amount
      } else {
        timeToData.set(time, {
          time: time as UTCTimestamp,
          value: bar.amount,
          tickValue: bar.tick,
          tickQ96: bar.tickQ96,
        })
      }
    }

    return Array.from(timeToData.values())
  }, [chartData.bars, groupTicksEnabled, groupedBars, priceScaleFactor, chartHoverResetKey, isPlacingBid])

  const totalBidVolume = chartData.totalBidVolume

  const { renderLabels } = useChartLabels({
    minTick: chartData.minTick,
    maxTick: chartData.maxTick,
    labelIncrement: chartData.labelIncrement,
    tickSize: tickSizeDecimal,
    colors: colorsForController,
    priceScaleFactor,
    targetMaxLabels,
  })

  const { formatPrice, formatTokenAmount } = useAuctionValueFormatters({
    bidTokenInfo,
    totalSupply,
    auctionTokenDecimals,
  })

  const { markerPositions, updateMarkerPositions, updateMarkerPositionsSync, clearMarkerPositions } =
    useBidMarkerPositions({
      userBids,
      bars: barsForMarkers,
      tickSizeDecimal,
      clearingPriceBigInt: onchainClearingPriceBigInt,
      connectedWalletAddress,
      chartRef,
      seriesRef,
      chartContainerRef,
      priceScaleFactor,
      height,
      getPlotDimensions,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals,
      groupSizeTicks: groupTicksEnabled ? tickGrouping?.groupSizeTicks : undefined,
    })

  const updateMarkerPositionsSyncRef = useRef(updateMarkerPositionsSync)
  const clearMarkerPositionsRef = useRef(clearMarkerPositions)
  useEffect(() => {
    updateMarkerPositionsSyncRef.current = updateMarkerPositionsSync
  }, [updateMarkerPositionsSync])
  useEffect(() => {
    clearMarkerPositionsRef.current = clearMarkerPositions
  }, [clearMarkerPositions])

  // Detect overlap between BidLineTooltip and ClearingPriceTooltip and get adjusted positions
  const {
    isStacked,
    bidLine: adjustedBidLinePos,
    clearingPrice: adjustedClearingPricePos,
    clearingPriceFlipLeft,
  } = useTooltipOverlapDetection({
    bidLineTooltipRef,
    clearingPriceTooltipRef,
    bidLineVisible: bidLineTooltipState.isVisible && !!effectiveUserBidPriceDecimal,
    clearingPriceVisible: clearingPriceTooltipState.isVisible,
    originalBidLinePosition: {
      left: bidLineTooltipState.left + BID_LINE.TOOLTIP_OFFSET_X,
      top: BID_LINE.TOOLTIP_TOP,
    },
    originalClearingPricePosition: {
      left: clearingPriceTooltipState.left + CLEARING_PRICE_LINE.LABEL_OFFSET_X,
      top: CLEARING_PRICE_LINE.LABEL_OFFSET_Y,
    },
    bidLineFlipLeft: bidLineTooltipState.flipLeft,
    forceStack: clickedNearClearingPrice,
  })

  // Stable callbacks for the imperative controller (prevents churn + makes effect deps clean).
  // Each callback always sees the latest values without requiring controller re-creation.
  // When auction is ended, clicking bars should not update the selected tick price
  const handleSelectedTickPrice = useEvent((tickPriceDecimalString: string) => {
    if (!isAuctionEnded) {
      setSelectedTickPrice(tickPriceDecimalString)
      // Auto-switch to PLACE_A_BID tab when clicking chart
      if (activeBidFormTab !== BidInfoTab.PLACE_A_BID) {
        setActiveBidFormTab(BidInfoTab.PLACE_A_BID)
      }
    }
  })
  const handleZoomStateChange = useEvent<[Parameters<typeof setChartZoomState>[1]], void>((state) => {
    if (isGroupedTicksRef.current) {
      setGroupedChartZoomState(state)
      return
    }
    setChartZoomState(chartMode, state)
  })
  const handleRequestMarkerPositionsUpdate = useEvent(() => updateMarkerPositions())
  const handleBidLineTooltipStateChange = useEvent<[ToucanBidLineTooltipState], void>((state) => {
    setBidLineTooltipState((prev) => (areBidLineTooltipStatesEqual(prev, state) ? prev : state))
  })
  const handleClearingPriceTooltipStateChange = useEvent<[ToucanClearingPriceTooltipState], void>((state) => {
    setClearingPriceTooltipState((prev) => (areClearingPriceTooltipStatesEqual(prev, state) ? prev : state))
  })
  // Increment the hover reset key to force a re-render with fresh hover state
  const handleResetHoverState = useEvent(() => {
    incrementChartHoverResetKey()
  })

  // Handle click near clearing price to trigger tooltip stacking
  const handleClickNearClearingPrice = useEvent(() => {
    setClickedNearClearingPrice(true)
    // Clear after a short delay to allow overlap detection to run with forceStack=true
    // and establish the stacked state before reverting to proximity-based stacking
    setTimeout(() => setClickedNearClearingPrice(false), 100)
  })

  const handleChartBarTooltipStateChange = useEvent<[ToucanChartBarTooltipState], void>((state) => {
    setChartBarTooltipState((prev) => (areChartBarTooltipStatesEqual(prev, state) ? prev : state))
  })
  const renderChartLabels = useEvent<[Parameters<typeof renderLabels>[0]], void>((params) => renderLabels(params))

  // State to track if we need to re-trigger navigation after chart data extends
  const [pendingRecenterBidTick, setPendingRecenterBidTick] = useState<number | null>(null)

  // Handle extending chart range when user's bid is out of range
  const handleExtendRangeRequired = useEvent((bidTickDecimal: number) => {
    // Extend to bid + padding ticks (uses same constant as the check in overlays.ts)
    const extendedMaxTick = bidTickDecimal + EXTENSION_PADDING_TICKS * tickSizeDecimal
    setCustomBidTick(extendedMaxTick)
    // Set pending recenter to navigate to bid after chart data regenerates
    setPendingRecenterBidTick(bidTickDecimal)
  })

  /**
   * Controller lifecycle (create once; destroy on unmount)
   *
   * Responsibility:
   * - Instantiate the imperative lightweight-charts controller
   * - Wire controller → store (selected tick, zoom state)
   * - Wire controller → React overlays (marker positions, bid-line tooltip state)
   */
  useEffect(() => {
    if (!chartContainerRef.current || controllerRef.current) {
      return undefined
    }

    controllerRef.current = new ToucanBidDistributionChartController({
      container: chartContainerRef.current,
      height,
      colors: colorsForController,
      tokenColor,
      chartMode,
      formatYAxisLabel: formatYAxisLabelStable,
      formatFdvValue: formatFdvValueStable,
      renderLabels: renderChartLabels,
      bidOutOfRangeLabel,
      fdvLabel,
      callbacks: {
        onSelectedTickPrice: handleSelectedTickPrice,
        onZoomStateChange: handleZoomStateChange,
        onRequestOverlayUpdate: () => {
          // Overlays are updated internally by the controller; this is kept for future hooks if needed.
        },
        onRequestMarkerPositionsUpdate: handleRequestMarkerPositionsUpdate,
        onBidLineTooltipStateChange: handleBidLineTooltipStateChange,
        onClearingPriceTooltipStateChange: handleClearingPriceTooltipStateChange,
        onChartBarTooltipStateChange: handleChartBarTooltipStateChange,
        onResetHoverState: handleResetHoverState,
        onClickNearClearingPrice: handleClickNearClearingPrice,
        onExtendRangeRequired: handleExtendRangeRequired,
      },
    })

    const refs = controllerRef.current.getRefs()
    chartRef.current = refs.chart
    seriesRef.current = refs.series

    if (pendingUpdateRef.current) {
      controllerRef.current.update(pendingUpdateRef.current)
      lastUpdateRef.current = pendingUpdateRef.current
      prevChartHoverResetKeyRef.current = chartHoverResetKeyRef.current
    }

    // Ensure markers sync once the chart is ready.
    updateMarkerPositionsSyncRef.current()

    return () => {
      clearMarkerPositionsRef.current()
      controllerRef.current?.destroy()
      controllerRef.current = null
      chartRef.current = null
      seriesRef.current = null
    }
  }, [
    bidOutOfRangeLabel,
    chartMode,
    colorsForController,
    fdvLabel,
    formatFdvValueStable,
    formatYAxisLabelStable,
    height,
    tokenColor,
    handleBidLineTooltipStateChange,
    handleClearingPriceTooltipStateChange,
    handleChartBarTooltipStateChange,
    handleClickNearClearingPrice,
    handleExtendRangeRequired,
    handleRequestMarkerPositionsUpdate,
    handleResetHoverState,
    handleSelectedTickPrice,
    handleZoomStateChange,
    renderChartLabels,
  ])

  useEffect(() => {
    if (!chartZoomCommand || chartZoomCommand.target !== chartMode) {
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
      controller.resetToInitialZoom()
    }

    // Clear the command after execution to prevent re-execution on re-renders
    clearChartZoomCommand()
  }, [chartMode, chartZoomCommand, clearChartZoomCommand])

  // When grouped tick mode is enabled, reset to the initial zoom (from zoomConfig.ts) and lock scaling.
  // We use a ref to signal the pending reset because setGroupedChartZoomState is batched by React
  // and won't take effect until the next render. The data update effect (which fires in the same
  // commit phase) needs to know about the reset immediately so it can pass the correct zoom state
  // to the controller.
  const wasGroupedTicksRef = useRef<boolean>(groupTicksEnabled)
  const pendingGroupedZoomResetRef = useRef(false)
  useEffect(() => {
    const wasGrouped = wasGroupedTicksRef.current
    wasGroupedTicksRef.current = groupTicksEnabled

    if (!wasGrouped && groupTicksEnabled) {
      // Reset grouped zoom state, but keep the non-grouped persisted zoom intact.
      setGroupedChartZoomState({ visibleRange: null, isZoomed: false })
      pendingGroupedZoomResetRef.current = true
    }
  }, [groupTicksEnabled])

  // After chart data is extended (customBidTick set), re-trigger navigation to the bid
  useEffect(() => {
    if (pendingRecenterBidTick === null || !controllerRef.current) {
      return
    }
    // Check if the chart data now includes the bid (maxTick from chartData includes extension)
    const scaledBidTime = Math.round(pendingRecenterBidTick * priceScaleFactor)
    const scaledMaxTime = Math.round(chartData.maxTick * priceScaleFactor)
    if (scaledBidTime <= scaledMaxTime) {
      // Chart data now includes the bid, trigger recenter
      const controller = controllerRef.current
      const refs = controller.getRefs()
      if (refs.chart && refs.minTime !== null && refs.maxTime !== null) {
        // Use requestAnimationFrame to ensure chart has updated with new data
        requestAnimationFrame(() => {
          // Directly set visible range to show the bid
          const timeScale = refs.chart?.timeScale()
          if (!timeScale) {
            return
          }
          try {
            const visibleRange = timeScale.getVisibleRange()
            if (!visibleRange) {
              return
            }
            const rangeSize = (visibleRange.to as number) - (visibleRange.from as number)
            const offsetRatio = 0.3
            const newFrom = Math.round(scaledBidTime - rangeSize * offsetRatio)
            const newTo = Math.round(newFrom + rangeSize)
            timeScale.setVisibleRange({
              from: newFrom as UTCTimestamp,
              to: newTo as UTCTimestamp,
            })
          } catch {
            // Ignore errors during chart transition
          }
        })
      }
      setPendingRecenterBidTick(null)
    }
  }, [pendingRecenterBidTick, chartData.maxTick, priceScaleFactor])

  // Auto-clear custom bid tick when user's bid is lowered within original data range
  useEffect(() => {
    if (
      customBidTick &&
      effectiveUserBidPriceDecimal &&
      chartData.maxTickFromData &&
      effectiveUserBidPriceDecimal <= chartData.maxTickFromData
    ) {
      // First, reset the controller's zoom and clear chart state
      controllerRef.current?.resetToInitialZoom()
      setChartZoomState(chartMode, { visibleRange: null, isZoomed: false })

      // Defer clearing customBidTick to allow the chart to settle after zoom reset.
      // This prevents a race condition where lightweight-charts internal state
      // still references the old visible range when setData() is called with smaller data.
      requestAnimationFrame(() => {
        setCustomBidTick(null)
      })
    }
  }, [
    effectiveUserBidPriceDecimal,
    customBidTick,
    chartData.maxTickFromData,
    setCustomBidTick,
    setChartZoomState,
    chartMode,
  ])

  /**
   * Push updates into controller (data + derived display state)
   *
   * Responsibility:
   * - Update the series data (bars) + dynamic series options (clearing price, tick size, concentration band, user bid)
   * - Apply/persist zoom state (x-axis visible range) through the controller
   * - Trigger overlay refreshes that depend on chart geometry (labels, markers, bid tooltip)
   */
  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) {
      return
    }

    const seriesOptionsPatch: Partial<ToucanChartSeriesOptions> = {
      chartMode,
      demandBackgroundGradient:
        chartMode === 'demand'
          ? createDemandBackgroundGradient(tokenColor || colorsForController.accent1.val)
          : undefined,
      demandBackgroundGapMaxTicks: chartMode === 'demand' ? DEMAND_BACKGROUND_GAP_MAX_VISIBLE_TICKS : undefined,
      demandOutOfRangeBackgroundGradient:
        chartMode === 'demand'
          ? {
              startColor: opacify(12, colorsForController.neutral1.val),
              endColor: opacify(0, colorsForController.neutral1.val),
            }
          : undefined,
    }

    // Check if hover reset key changed - if so, we need to reset hover state
    // Note: We update the ref AFTER controller.update() to avoid stale values if React batches updates
    const shouldResetHoverState = chartHoverResetKey !== prevChartHoverResetKeyRef.current

    // When transitioning to grouped mode, the setGroupedChartZoomState call in the groupTicksEnabled
    // effect is batched by React and hasn't taken effect yet. Override effectiveChartZoomState with
    // the reset value so the controller applies the initial zoom with the new grouped data.
    const shouldResetZoom = pendingGroupedZoomResetRef.current
    if (shouldResetZoom) {
      pendingGroupedZoomResetRef.current = false
    }
    const chartZoomStateForUpdate = shouldResetZoom
      ? { visibleRange: null as { from: number; to: number } | null, isZoomed: false }
      : effectiveChartZoomState

    const nextUpdateParams: ToucanBidDistributionChartControllerUpdateParams = {
      histogramData,
      barsForMarkers,
      minTick: chartData.minTick,
      maxTick: chartData.maxTick,
      tickSizeDecimal,
      clearingPriceDecimal,
      clearingPriceBigInt,
      priceScaleFactor,
      rangePaddingUnits,
      totalBidVolume,
      bidTokenInfo,
      totalSupply,
      auctionTokenDecimals,
      floorPriceQ96: floorPrice,
      clearingPriceQ96: clearingPrice,
      tickSizeQ96: tickSize,
      chartZoomState: chartZoomStateForUpdate,
      userBidPriceDecimal: isAuctionEnded || !isPlacingBid ? null : effectiveUserBidPriceDecimal,
      concentration,
      userBids,
      connectedWalletAddress,
      seriesOptionsPatch,
      isZoomEnabled: chartMode === 'demand' || !groupTicksEnabled,
      shouldResetHoverState,
      forceInitialZoom: shouldResetZoom,
    }

    // Always keep pendingUpdateRef in sync so controller initialization uses latest params
    pendingUpdateRef.current = nextUpdateParams

    const shouldUpdate =
      shouldResetHoverState ||
      shouldResetZoom ||
      !lastUpdateRef.current ||
      !areUpdateParamsEqual(lastUpdateRef.current, nextUpdateParams)

    if (!shouldUpdate) {
      return
    }

    controller.update(nextUpdateParams)
    lastUpdateRef.current = nextUpdateParams

    // Update the ref after controller.update() completes to ensure consistent state
    prevChartHoverResetKeyRef.current = chartHoverResetKey
  }, [
    auctionTokenDecimals,
    barsForMarkers,
    bidTokenInfo,
    chartData.maxTick,
    chartData.minTick,
    effectiveChartZoomState,
    clearingPrice,
    clearingPriceBigInt,
    clearingPriceDecimal,
    concentration,
    floorPrice,
    histogramData,
    groupTicksEnabled,
    isAuctionEnded,
    isPlacingBid,
    priceScaleFactor,
    rangePaddingUnits,
    tickSize,
    tickSizeDecimal,
    totalBidVolume,
    totalSupply,
    effectiveUserBidPriceDecimal,
    userBids,
    connectedWalletAddress,
    chartHoverResetKey,
    chartMode,
    colorsForController.accent1.val,
    colorsForController.neutral1.val,
    tokenColor,
  ])

  return (
    <Flex width="100%" height={height + LABEL_CONFIG.PADDING_BOTTOM}>
      <ChartWrapper height={height}>
        <ChartContainer ref={chartContainerRef} height={height} />
        <BidMarkerOverlay
          markerPositions={markerPositions}
          bidTokenInfo={bidTokenInfo}
          formatPrice={formatPrice}
          formatTokenAmount={formatTokenAmount}
        />
        {effectiveUserBidPriceDecimal && !isAuctionEnded && isPlacingBid && (
          <BidLineTooltip
            ref={bidLineTooltipRef}
            left={adjustedBidLinePos.left}
            top={adjustedBidLinePos.top}
            isVisible={bidLineTooltipState.isVisible}
            volumeAtTick={bidLineTooltipState.volumeAtTick}
            volumePercent={bidLineTooltipState.volumePercent}
            connectedWalletAddress={connectedWalletAddress}
            flipLeft={bidLineTooltipState.flipLeft}
          />
        )}
        <ClearingPriceTooltip
          ref={clearingPriceTooltipRef}
          state={clearingPriceTooltipState}
          bidTokenInfo={bidTokenInfo}
          totalSupply={totalSupply}
          auctionTokenDecimals={auctionTokenDecimals}
          overrideLeft={isStacked ? adjustedClearingPricePos.left : undefined}
          overrideTop={isStacked ? adjustedClearingPricePos.top : undefined}
          flipLeft={clearingPriceFlipLeft}
          isAuctionEnded={isAuctionEnded}
        />
        <ChartBarTooltip
          left={chartBarTooltipState.left}
          top={chartBarTooltipState.top}
          isVisible={chartBarTooltipState.isVisible}
          tickValue={chartBarTooltipState.tickValue}
          volumeAmount={chartBarTooltipState.volumeAmount}
          totalVolume={chartBarTooltipState.totalVolume}
          bidTokenInfo={bidTokenInfo}
          totalSupply={totalSupply}
          auctionTokenDecimals={auctionTokenDecimals}
          formatter={formatFdvValue}
          volumeFormatter={formatYAxisLabel}
        />
      </ChartWrapper>
    </Flex>
  )
}

export const BidDistributionChartRenderer = memo(BidDistributionChartRendererComponent, areRendererPropsEqual)
