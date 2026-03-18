import { CHART_BEHAVIOR } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import {
  type ChartStoreState,
  DefaultPriceStrategy,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { boundPanY } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/boundPanY'
import { calculateStrategyTicks } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceStrategies'
import {
  calculateMaxZoom,
  calculateRangeViewport,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/rangeViewportUtils'
import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { RangeAmountInputPriceMode } from '~/components/Liquidity/Create/types'
import { tryParseV4Tick } from '~/components/Liquidity/utils/priceRangeInfo'

interface ViewActionCallbacks {
  onInputModeChange: (inputMode: RangeAmountInputPriceMode) => void
  onChartError: (error: string) => void
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
    const { zoomLevel, panY, actions, dimensions } = get()

    const viewportHeight = dimensions.height
    const centerY = viewportHeight / 2

    // Calculate new panY to keep center fixed during zoom
    const zoomRatio = targetZoom / zoomLevel
    const newPanY = centerY - (centerY - panY) * zoomRatio

    const targetPanY = boundPanY({
      panY: newPanY,
      viewportHeight,
      zoomLevel: targetZoom,
    })

    actions.animateToState({
      targetZoom,
      targetPan: targetPanY,
      targetMinTick: undefined,
      targetMaxTick: undefined,
    })
  },

  zoomIn: () => {
    const { actions, zoomLevel, tickSpacing } = get()
    const targetZoom = Math.min(zoomLevel * CHART_BEHAVIOR.ZOOM_FACTOR, calculateMaxZoom(tickSpacing))

    actions.zoom(targetZoom)
  },

  zoomOut: () => {
    const { actions, zoomLevel } = get()

    const targetZoom = Math.max(zoomLevel / CHART_BEHAVIOR.ZOOM_FACTOR, CHART_BEHAVIOR.ZOOM_MIN)

    actions.zoom(targetZoom)
  },

  centerRange: () => {
    const { minTick, maxTick, renderingContext, actions } = get()

    if (minTick === undefined || maxTick === undefined || !renderingContext) {
      return
    }

    const { tickSpacing } = renderingContext

    const { targetZoom, targetPanY } = calculateRangeViewport({
      minTick,
      maxTick,
      tickSpacing,
    })

    // Animate to the calculated state
    actions.animateToState({
      targetZoom,
      targetPan: targetPanY,
      targetMinTick: undefined,
      targetMaxTick: undefined,
    })
  },

  reset: (params?: { animate?: boolean; minTick?: number | null; maxTick?: number | null }) => {
    const { animate = true, minTick: providedMinTick, maxTick: providedMaxTick } = params ?? {}
    const { actions, isFullRange, renderingContext, baseCurrency, quoteCurrency } = get()

    if (!renderingContext || !baseCurrency || !quoteCurrency) {
      return
    }

    const { priceData, liquidityData, tickSpacing, currentTick } = renderingContext

    // If full range, use the min and max liquidity data points

    const minTickValue = liquidityData[0].tick
    const maxTickValue = liquidityData[liquidityData.length - 1].tick

    // Calculate default range using price RATIOS relative to current price.
    // This correctly handles token decimal differences (e.g., WBTC 8 decimals vs USDC 6 decimals)
    // because tick differences represent price ratios: price1/price2 = 1.0001^(tick1-tick2)
    //
    // Step by step calculation:
    // 1. Find historical price bounds and current price
    // 2. Calculate viewport prices centered on current price
    // 3. Convert price ratios to tick offsets from currentTick
    //
    // For example, if the pair is stablecoin (e.g. USDC/USDT):
    // - price bounds: 0.98 to 1.02, current: 1.00
    // - min ratio: 0.988/1.00 = 0.988, max ratio: 1.016/1.00 = 1.016
    // - min tick offset: log(0.988)/log(1.0001) ≈ -120, max: log(1.016)/log(1.0001) ≈ +159

    // Calculate price data bounds (historical price range)
    const { min: priceDataMin, max: priceDataMax } = getCandlestickPriceBounds(priceData)

    // Get current price (most recent price point)
    const currentPrice = priceData[priceData.length - 1]?.value || 0

    // Calculate viewport bounds (centered on current price, fitting all data)
    const maxSpread = Math.max(currentPrice - priceDataMin, priceDataMax - currentPrice)
    const viewportRange = 2 * maxSpread
    const minVisiblePrice = currentPrice - viewportRange / 2
    const maxVisiblePrice = currentPrice + viewportRange / 2

    const visibleRange = maxVisiblePrice - minVisiblePrice

    // Take the 20%-80% of the viewport range (middle 60%) as the default range
    const calculatedDefaultMinPrice = minVisiblePrice + visibleRange * 0.2
    const calculatedDefaultMaxPrice = minVisiblePrice + visibleRange * 0.8

    // Convert display prices to ticks using the SDK
    const defaultMinTick = tryParseV4Tick({
      baseToken: baseCurrency,
      quoteToken: quoteCurrency,
      value: String(Math.max(calculatedDefaultMinPrice, 0)),
      tickSpacing,
    })
    const defaultMaxTick = tryParseV4Tick({
      baseToken: baseCurrency,
      quoteToken: quoteCurrency,
      value: String(Math.max(calculatedDefaultMaxPrice, 0)),
      tickSpacing,
    })

    if (defaultMinTick === undefined || defaultMaxTick === undefined) {
      callbacks.onChartError('Failed to calculate default ticks')
      return
    }

    // Store default ticks in state
    set((state) => ({
      ...state,
      defaultMinTick,
      defaultMaxTick,
      selectedPriceStrategy: undefined,
    }))

    // For the actual position, use provided ticks or fall back to defaults
    let minTick = providedMinTick ?? defaultMinTick
    let maxTick = providedMaxTick ?? defaultMaxTick

    // If there is not enough data to calculate the default range, use the stable strategy (±3 ticks)
    if (minTick === maxTick) {
      const { minTick: newMinTick, maxTick: newMaxTick } = calculateStrategyTicks({
        priceStrategy: DefaultPriceStrategy.STABLE,
        currentTick,
        tickSpacing,
        defaultMinTick,
        defaultMaxTick,
      })

      minTick = newMinTick
      maxTick = newMaxTick
    }

    if (isFullRange) {
      const { targetZoom: desiredZoom, targetPanY: centerPanY } = calculateRangeViewport({
        minTick: minTickValue,
        maxTick: maxTickValue,
        tickSpacing,
      })

      actions.setChartState({
        zoomLevel: desiredZoom,
        panY: centerPanY,
        minTick: minTickValue,
        maxTick: maxTickValue,
      })

      return
    }

    // Center the range on the default min and max prices
    const { targetZoom: desiredZoom, targetPanY: centerPanY } = calculateRangeViewport({
      minTick,
      maxTick,
      tickSpacing,
    })

    if (animate) {
      actions.animateToState({
        targetZoom: desiredZoom,
        targetPan: centerPanY,
        targetMinTick: minTick,
        targetMaxTick: maxTick,
      })
    } else {
      actions.setChartState({
        zoomLevel: desiredZoom,
        panY: centerPanY,
        minTick,
        maxTick,
      })
    }

    // Wait until animation is complete before calling handleTickChange
    setTimeout(
      () => {
        actions.handleTickChange({ changeType: 'min', tick: minTick })
        actions.handleTickChange({ changeType: 'max', tick: maxTick })
      },
      animate ? CHART_BEHAVIOR.ANIMATION_DURATION : 0,
    )
  },

  initializeView: () => {
    const { initialViewSet, actions, minTick, maxTick, renderingContext } = get()
    if (!renderingContext) {
      return
    }

    if (!initialViewSet) {
      actions.reset({ animate: false, minTick, maxTick })

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
