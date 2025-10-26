import { CHART_BEHAVIOR } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartStoreState,
  TickNavigationParams,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { DefaultPriceStrategy } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getClosestTick } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/getClosestTick'
import {
  calculateStrategyPrices,
  detectPriceStrategy,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceStrategies'
import { calculateRangeViewport } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/rangeViewportUtils'
import { navigateTick } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'

interface PriceActionCallbacks {
  onMinPriceChange: (price?: number) => void
  onMaxPriceChange: (price?: number) => void
}

export const createPriceActions = ({
  set,
  get,
  callbacks,
}: {
  set: (fn: (state: ChartStoreState) => ChartStoreState) => void
  get: () => ChartStoreState
  callbacks: PriceActionCallbacks
}) => ({
  // WARNING: This function will cause the CreateLiquidityContext to re-render.
  // Use this sparingly when a user action is complete (i.e drag ends).
  // This function should not react to min/max state changes.
  handlePriceChange: (changeType: 'min' | 'max', price?: number) => {
    if (changeType === 'min') {
      callbacks.onMinPriceChange(price)
    } else {
      callbacks.onMaxPriceChange(price)
    }

    const { maxPrice, minPrice, selectedPriceStrategy, renderingContext } = get()

    if (!renderingContext) {
      return
    }

    const currentPrice = renderingContext.priceData[renderingContext.priceData.length - 1]?.value || 0
    const detectedStrategy = detectPriceStrategy({
      minPrice,
      maxPrice,
      currentPrice,
      liquidityData: renderingContext.liquidityData,
    })

    const currentSelectedStrategy = selectedPriceStrategy
    if (detectedStrategy !== currentSelectedStrategy) {
      set((state) => ({ ...state, selectedPriceStrategy: detectedStrategy }))
    }
  },

  setPriceStrategy: ({ priceStrategy, animate = true }: { priceStrategy: DefaultPriceStrategy; animate: boolean }) => {
    const { actions, dimensions, dynamicZoomMin, renderingContext, defaultMinPrice, defaultMaxPrice } = get()
    if (!renderingContext) {
      return
    }

    set((state) => ({
      ...state,
      selectedPriceStrategy: priceStrategy,
      isFullRange: priceStrategy === DefaultPriceStrategy.FULL_RANGE,
    }))

    const { priceData, liquidityData } = renderingContext
    const currentPrice = priceData[priceData.length - 1].value || 0

    const { minPrice: targetMinPrice, maxPrice: targetMaxPrice } = calculateStrategyPrices({
      priceStrategy,
      currentPrice,
      liquidityData,
      defaultMinPrice,
      defaultMaxPrice,
    })

    const { index: minTickIndex } = getClosestTick(liquidityData, targetMinPrice)
    const { index: maxTickIndex } = getClosestTick(liquidityData, targetMaxPrice)

    const { targetZoom, targetPanY } = calculateRangeViewport({
      minTickIndex,
      maxTickIndex,
      liquidityData,
      dynamicZoomMin,
      dimensions,
    })

    if (animate) {
      actions.animateToState({
        targetZoom,
        targetPan: targetPanY,
        targetMinPrice,
        targetMaxPrice,
      })
    } else {
      actions.setChartState({
        zoomLevel: targetZoom,
        panY: targetPanY,
        minPrice: targetMinPrice,
        maxPrice: targetMaxPrice,
      })
    }

    setTimeout(() => {
      actions.handlePriceChange('min', targetMinPrice)
      actions.handlePriceChange('max', targetMaxPrice)
    }, CHART_BEHAVIOR.ANIMATION_DURATION)
  },

  incrementMax: ({
    tickSpacing,
    baseCurrency,
    quoteCurrency,
    priceInverted,
    protocolVersion,
  }: TickNavigationParams) => {
    const { maxPrice, actions } = get()
    if (!maxPrice) {
      return
    }

    const newPrice = navigateTick({
      currentPrice: maxPrice,
      tickSpacing,
      direction: 'increment',
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
    })

    if (newPrice !== undefined) {
      actions.setChartState({ maxPrice: newPrice })
      actions.handlePriceChange('max', newPrice)
    }
  },

  decrementMax: ({
    tickSpacing,
    baseCurrency,
    quoteCurrency,
    priceInverted,
    protocolVersion,
  }: TickNavigationParams) => {
    const { maxPrice, actions } = get()
    if (!maxPrice) {
      return
    }

    const newPrice = navigateTick({
      currentPrice: maxPrice,
      tickSpacing,
      direction: 'decrement',
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
    })

    if (newPrice !== undefined) {
      actions.setChartState({ maxPrice: newPrice })
      actions.handlePriceChange('max', newPrice)
    }
  },

  incrementMin: ({
    tickSpacing,
    baseCurrency,
    quoteCurrency,
    priceInverted,
    protocolVersion,
  }: TickNavigationParams) => {
    const { minPrice, actions } = get()
    if (!minPrice) {
      return
    }

    const newPrice = navigateTick({
      currentPrice: minPrice,
      tickSpacing,
      direction: 'increment',
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
    })

    if (newPrice !== undefined) {
      actions.setChartState({ minPrice: newPrice })
      actions.handlePriceChange('min', newPrice)
    }
  },

  decrementMin: ({
    tickSpacing,
    baseCurrency,
    quoteCurrency,
    priceInverted,
    protocolVersion,
  }: TickNavigationParams) => {
    const { minPrice, actions } = get()
    if (!minPrice) {
      return
    }

    const newPrice = navigateTick({
      currentPrice: minPrice,
      tickSpacing,
      direction: 'decrement',
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
    })

    if (newPrice !== undefined) {
      actions.setChartState({ minPrice: newPrice })
      actions.handlePriceChange('min', newPrice)
    }
  },

  syncIsFullRangeFromParent: (isFullRange: boolean) => {
    const { actions, isFullRange: currentIsFullRange } = get()
    if (currentIsFullRange === isFullRange) {
      return
    }

    set((state) => ({ ...state, isFullRange }))
    actions.reset({ animate: false })
  },
})
