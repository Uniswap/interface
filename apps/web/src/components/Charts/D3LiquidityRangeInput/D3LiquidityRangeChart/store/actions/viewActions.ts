import {
  CHART_BEHAVIOR,
  CHART_DIMENSIONS,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type { ChartStoreState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { boundPanY } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/boundPanY'
import { calculateDynamicZoomMin } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/chartUtils'
import { getClosestTick } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/getClosestTick'
import { calculateRangeViewport } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/rangeViewportUtils'
import { getCandlestickPriceBounds } from 'components/Charts/PriceChart/utils'
import { RangeAmountInputPriceMode } from 'components/Liquidity/Create/types'

interface ViewActionCallbacks {
  onInputModeChange: (inputMode: RangeAmountInputPriceMode) => void
}

export const createViewActions = ({
  set,
  get,
  callbacks,
}: {
  set: (fn: (state: ChartStoreState) => ChartStoreState) => void
  get: () => ChartStoreState
  callbacks: ViewActionCallbacks
}) => ({
  zoom: (targetZoom: number) => {
    const { zoomLevel, panY, actions, dimensions, renderingContext } = get()

    const viewportHeight = dimensions.height
    const centerY = viewportHeight / 2

    // Calculate new panY to keep center fixed during zoom
    const zoomRatio = targetZoom / zoomLevel
    const newPanY = centerY - (centerY - panY) * zoomRatio

    const targetPanY = renderingContext?.liquidityData
      ? boundPanY({
          panY: newPanY,
          viewportHeight,
          liquidityData: renderingContext.liquidityData,
          zoomLevel: targetZoom,
        })
      : newPanY

    actions.animateToState({
      targetZoom,
      targetPan: targetPanY,
      targetMinPrice: undefined,
      targetMaxPrice: undefined,
    })
  },

  zoomIn: () => {
    const { actions, zoomLevel } = get()
    const targetZoom = Math.min(zoomLevel * CHART_BEHAVIOR.ZOOM_FACTOR, CHART_BEHAVIOR.ZOOM_MAX)

    actions.zoom(targetZoom)
  },

  zoomOut: () => {
    const { actions, zoomLevel, dynamicZoomMin } = get()

    const targetZoom = Math.max(zoomLevel / CHART_BEHAVIOR.ZOOM_FACTOR, dynamicZoomMin)

    actions.zoom(targetZoom)
  },

  centerRange: () => {
    const { minPrice, maxPrice, dimensions, dynamicZoomMin, renderingContext, actions } = get()

    if (
      minPrice === undefined ||
      maxPrice === undefined ||
      !renderingContext?.liquidityData ||
      renderingContext.liquidityData.length === 0
    ) {
      return
    }

    const { liquidityData } = renderingContext

    // Find the ticks that correspond to minPrice and maxPrice
    const { index: minTickIndex } = getClosestTick(liquidityData, minPrice)
    const { index: maxTickIndex } = getClosestTick(liquidityData, maxPrice)

    const { targetZoom, targetPanY } = calculateRangeViewport({
      minTickIndex,
      maxTickIndex,
      liquidityData,
      dimensions,
      dynamicZoomMin,
    })

    // Animate to the calculated state
    actions.animateToState({
      targetZoom,
      targetPan: targetPanY,
      targetMinPrice: undefined,
      targetMaxPrice: undefined,
    })
  },

  reset: (params?: { animate?: boolean; minPrice?: number | null; maxPrice?: number | null }) => {
    const { animate = true, minPrice: providedMinPrice, maxPrice: providedMaxPrice } = params ?? {}
    const { actions, isFullRange, dynamicZoomMin, renderingContext } = get()

    if (!renderingContext) {
      return
    }

    const { priceData, liquidityData } = renderingContext

    // If full range, use the min and max liquidity data points
    const minPriceValue = liquidityData[0].price0
    const maxPriceValue = liquidityData[liquidityData.length - 1].price0

    // If minPrice or maxPrice is not provided, use 20%-80% of the viewport range
    // The viewport is centered on current price and sized to fit all historical data
    //
    // Step by step calculation:
    // 1. Find the distance from current price to the data bounds
    // 2. Create viewport that extends equally in both directions from current price
    // 3. Take middle 60% (20%-80%) of that viewport as default range
    //
    // For example, if the pair is stablecoin (e.g. USDC/USDT):
    // - price data bounds: 0.98 to 1.02
    // - current price: 1.00
    // - max spread: max(1.00 - 0.98, 1.02 - 1.00) = 0.02
    // - viewport: 1.00 ± (2 × 0.02) / 2 = 0.98 to 1.02
    // - default range: 0.98 + (1.02 - 0.98) × 0.2 = 0.988 to 1.016

    //
    // For volatile pairs (e.g. ETH/USDC):
    // - price data bounds: 2000 to 5000
    // - current price: 3200
    // - max spread: max(3200 - 2000, 5000 - 3200) = 1800
    // - viewport: 3200 ± (2 × 1800) / 2 = 1400 to 5000
    // - default range: 1400 + (5000 - 1400) × 0.2 = 2120 to 4280

    // Calculate price data bounds (historical price range)
    const { min: priceDataMin, max: priceDataMax } = getCandlestickPriceBounds(priceData)

    // Get current price (most recent price point)
    const currentPrice = priceData[priceData.length - 1]?.value || 0

    // Calculate viewport bounds (centered on current price, fitting all data)
    const maxSpread = Math.max(currentPrice - priceDataMin, priceDataMax - currentPrice)
    const viewportRange = 2 * maxSpread
    const minVisiblePrice = currentPrice - viewportRange / 2
    const maxVisiblePrice = currentPrice + viewportRange / 2

    // Take 20%-80% of the viewport range (middle 60%)
    const visibleRange = maxVisiblePrice - minVisiblePrice

    // Calculate and store the default 20%-80% range
    const calculatedDefaultMinPrice = minVisiblePrice + visibleRange * 0.2
    const calculatedDefaultMaxPrice = minVisiblePrice + visibleRange * 0.8

    // Find ticks for calculated default prices
    const { index: defaultMinTickIndex } = getClosestTick(liquidityData, calculatedDefaultMinPrice)
    const { index: defaultMaxTickIndex } = getClosestTick(liquidityData, calculatedDefaultMaxPrice)
    const defaultMinPrice = liquidityData[defaultMinTickIndex].price0
    const defaultMaxPrice = liquidityData[defaultMaxTickIndex].price0

    // Store default prices in state
    set((state) => ({
      ...state,
      defaultMinPrice,
      defaultMaxPrice,
      selectedPriceStrategy: undefined,
    }))

    // For the actual position, use provided prices or fall back to defaults
    const minPrice = providedMinPrice ?? defaultMinPrice
    const maxPrice = providedMaxPrice ?? defaultMaxPrice

    // Find ticks for the actual position
    const { index: minTickIndex } = getClosestTick(liquidityData, minPrice)
    const { index: maxTickIndex } = getClosestTick(liquidityData, maxPrice)

    const resetDimensions = { width: 0, height: CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT }

    // Center the range on the default min and max prices
    const { targetZoom: desiredZoom, targetPanY: centerPanY } = calculateRangeViewport({
      minTickIndex,
      maxTickIndex,
      liquidityData,
      dimensions: resetDimensions,
      dynamicZoomMin,
    })

    if (isFullRange) {
      actions.setChartState({
        zoomLevel: desiredZoom,
        panY: centerPanY,
        minPrice: minPriceValue,
        maxPrice: maxPriceValue,
      })

      return
    }

    if (animate) {
      actions.animateToState({
        targetZoom: desiredZoom,
        targetPan: centerPanY,
        targetMinPrice: minPrice,
        targetMaxPrice: maxPrice,
      })
    } else {
      actions.setChartState({
        zoomLevel: desiredZoom,
        panY: centerPanY,
        minPrice,
        maxPrice,
      })
    }

    // Wait until animation is complete before calling handlePriceChange
    setTimeout(
      () => {
        actions.handlePriceChange('min', minPrice)
        actions.handlePriceChange('max', maxPrice)
      },
      animate ? CHART_BEHAVIOR.ANIMATION_DURATION : 0,
    )
  },

  initializeView: () => {
    const { initialViewSet, actions, minPrice, maxPrice, renderingContext } = get()
    if (!renderingContext) {
      return
    }
    const { liquidityData } = renderingContext

    // Calculate and store dynamic zoom minimum when data is initialized
    const dynamicZoomMin = calculateDynamicZoomMin(liquidityData.length)

    set((state) => ({ ...state, dynamicZoomMin }))

    if (!initialViewSet) {
      actions.reset({ animate: false, minPrice, maxPrice })

      set((state) => ({
        ...state,
        initialViewSet: true,
      }))
    }
  },

  updateDimensions: (dimensions: { width: number; height: number }) => {
    set((state) => ({ ...state, dimensions }))
    const { actions } = get()
    actions.drawAll()
  },

  toggleInputMode: () => {
    const newMode =
      get().inputMode === RangeAmountInputPriceMode.PRICE
        ? RangeAmountInputPriceMode.PERCENTAGE
        : RangeAmountInputPriceMode.PRICE
    set((state) => ({
      ...state,
      inputMode: newMode,
    }))

    callbacks.onInputModeChange(newMode)
  },
})
