import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { CHART_BEHAVIOR, CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { createChartActions } from '~/features/Liquidity/charts/D3LiquidityChartShared/store/createChartActions'
import {
  calculateMaxZoom,
  calculateRangeViewport,
} from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/viewportUtils'
import {
  type ChartStoreState,
  DefaultPriceStrategy,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { calculateStrategyTicks } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceStrategies'
import { snapTickToSpacing } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import { RangeAmountInputPriceMode } from '~/features/Liquidity/Create/types'
import { tryParseV4Tick } from '~/features/Liquidity/utils/priceRangeInfo'

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
}) => {
  const coreActions = createChartActions<ChartStoreState>({
    set,
    get,
    getPan: (state) => state.panY,
    getViewportSize: (state) => state.dimensions.height,
    getContentSize: () => CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT,
    setPan: (state, pan) => ({ ...state, panY: pan }),
    calculateMaxZoom: (tickSpacing, _viewportSize) => calculateMaxZoom(tickSpacing),
  })

  return {
    zoom: coreActions.zoom,
    zoomIn: coreActions.zoomIn,
    zoomOut: coreActions.zoomOut,
    animateToState: coreActions.animateToState,

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
      })
    },

    reset: (params?: { animate?: boolean; minTick?: number | null; maxTick?: number | null }) => {
      const { animate = true, minTick: providedMinTick, maxTick: providedMaxTick } = params ?? {}
      const {
        actions,
        isFullRange,
        renderingContext,
        baseCurrency,
        quoteCurrency,
        minTick: currentMinTick,
        maxTick: currentMaxTick,
      } = get()

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

      if (isFullRange && priceData.length > 0) {
        const { priceToY, yToTick } = renderingContext
        const viewportMinTick = snapTickToSpacing(yToTick(priceToY({ price: priceDataMin })), tickSpacing)
        const viewportMaxTick = snapTickToSpacing(yToTick(priceToY({ price: priceDataMax })), tickSpacing)

        const { targetZoom: desiredZoom, targetPanY: centerPanY } = calculateRangeViewport({
          minTick: viewportMinTick,
          maxTick: viewportMaxTick,
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
          ticks:
            currentMinTick !== undefined && currentMaxTick !== undefined
              ? {
                  startMinTick: currentMinTick,
                  startMaxTick: currentMaxTick,
                  targetMinTick: minTick,
                  targetMaxTick: maxTick,
                  snapTicks: (min, max) => ({
                    minTick: snapTickToSpacing(min, tickSpacing),
                    maxTick: snapTickToSpacing(max, tickSpacing),
                  }),
                }
              : undefined,
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
  }
}
