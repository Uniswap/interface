import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
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
import { getDefaultRangeTicks } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/defaultPriceRange'
import { calculateStrategyTicks } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceStrategies'
import { snapTickToSpacing } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import { RangeAmountInputPriceMode } from '~/features/Liquidity/Create/types'

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

    reset: (params?: { animate?: boolean; emit?: boolean; minTick?: number | null; maxTick?: number | null }) => {
      const { animate = true, emit = true, minTick: providedMinTick, maxTick: providedMaxTick } = params ?? {}
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

      // Full range spans the liquidity distribution. A pool being created has none (the chart only
      // borrows a sibling's price line), so it spans the whole usable tick range instead.
      const minTickValue = liquidityData.at(0)?.tick ?? nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
      const maxTickValue = liquidityData.at(-1)?.tick ?? nearestUsableTick(TickMath.MAX_TICK, tickSpacing)

      // Calculate price data bounds (historical price range)
      const { min: priceDataMin, max: priceDataMax } = getCandlestickPriceBounds(priceData)

      const { defaultMinTick, defaultMaxTick } = getDefaultRangeTicks({
        priceData,
        tickSpacing,
        baseCurrency,
        quoteCurrency,
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

      if (!emit) {
        return
      }

      // Wait until animation is complete before emitting the range
      setTimeout(
        () => {
          actions.handleTickRangeChange({ minTick, maxTick })
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
