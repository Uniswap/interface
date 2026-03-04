import { CHART_BEHAVIOR } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import type {
  ChartStoreState,
  TickNavigationParams,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'

import { DefaultPriceStrategy } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import {
  calculateStrategyTicks,
  detectTickStrategy,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceStrategies'
import { calculateRangeViewport } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/rangeViewportUtils'
import { navigateTick } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'

interface PriceActionCallbacks {
  onMinTickChange: (tick?: number) => void
  onMaxTickChange: (tick?: number) => void
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
  handleTickChange: ({ changeType, tick }: { changeType: 'min' | 'max'; tick?: number }) => {
    if (changeType === 'min') {
      callbacks.onMinTickChange(tick)
    } else {
      callbacks.onMaxTickChange(tick)
    }

    const { maxTick, minTick, selectedPriceStrategy, renderingContext } = get()

    if (!renderingContext) {
      return
    }

    const { tickSpacing, currentTick } = renderingContext

    const detectedStrategy = detectTickStrategy({
      minTick,
      maxTick,
      currentTick,
      tickSpacing,
    })

    const currentSelectedStrategy = selectedPriceStrategy
    if (detectedStrategy !== currentSelectedStrategy) {
      set((state) => ({ ...state, selectedPriceStrategy: detectedStrategy }))
    }
  },

  setPriceStrategy: ({ priceStrategy, animate = true }: { priceStrategy: DefaultPriceStrategy; animate: boolean }) => {
    const { actions, renderingContext, minTick: defaultMinTick, maxTick: defaultMaxTick } = get()
    if (!renderingContext) {
      return
    }

    set((state) => ({
      ...state,
      selectedPriceStrategy: priceStrategy,
      isFullRange: priceStrategy === DefaultPriceStrategy.FULL_RANGE,
    }))

    const { tickSpacing, currentTick } = renderingContext

    const { minTick: targetMinTick, maxTick: targetMaxTick } = calculateStrategyTicks({
      priceStrategy,
      currentTick,
      tickSpacing,
      defaultMinTick,
      defaultMaxTick,
    })

    const { targetZoom, targetPanY } = calculateRangeViewport({
      minTick: targetMinTick,
      maxTick: targetMaxTick,
      tickSpacing,
    })

    if (animate) {
      actions.animateToState({
        targetZoom,
        targetPan: targetPanY,
        targetMinTick,
        targetMaxTick,
      })
    } else {
      actions.setChartState({
        zoomLevel: targetZoom,
        panY: targetPanY,
        minTick: targetMinTick,
        maxTick: targetMaxTick,
      })
    }

    setTimeout(() => {
      const { renderingContext } = get()
      if (renderingContext) {
        actions.handleTickChange({ changeType: 'min', tick: targetMinTick })
        actions.handleTickChange({ changeType: 'max', tick: targetMaxTick })
      }
    }, CHART_BEHAVIOR.ANIMATION_DURATION)
  },

  incrementMax: ({ tickSpacing, baseCurrency, quoteCurrency, protocolVersion }: TickNavigationParams) => {
    const { maxTick, actions, renderingContext } = get()
    if (maxTick === undefined) {
      return
    }

    const result = navigateTick({
      currentTick: maxTick,
      direction: 'increment',
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      protocolVersion,
      liquidityData: renderingContext?.liquidityData,
    })
    if (!result) {
      return
    }

    const newTick = result.tick

    actions.setChartState({ maxTick: newTick })
    actions.handleTickChange({ changeType: 'max', tick: newTick })
  },

  decrementMax: ({ tickSpacing, baseCurrency, quoteCurrency, protocolVersion }: TickNavigationParams) => {
    const { maxTick, actions, renderingContext } = get()
    if (maxTick === undefined) {
      return
    }

    const result = navigateTick({
      currentTick: maxTick,
      direction: 'decrement',
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      protocolVersion,
      liquidityData: renderingContext?.liquidityData,
    })
    if (!result) {
      return
    }

    const newTick = result.tick

    actions.setChartState({ maxTick: newTick })
    actions.handleTickChange({ changeType: 'max', tick: newTick })
  },

  incrementMin: ({ tickSpacing, baseCurrency, quoteCurrency, protocolVersion }: TickNavigationParams) => {
    const { minTick, actions, renderingContext } = get()
    if (minTick === undefined) {
      return
    }

    const result = navigateTick({
      currentTick: minTick,
      direction: 'increment',
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      protocolVersion,
      liquidityData: renderingContext?.liquidityData,
    })
    if (!result) {
      return
    }

    const newTick = result.tick

    actions.setChartState({ minTick: newTick })
    actions.handleTickChange({ changeType: 'min', tick: newTick })
  },

  decrementMin: ({ tickSpacing, baseCurrency, quoteCurrency, protocolVersion }: TickNavigationParams) => {
    const { minTick, actions, renderingContext } = get()
    if (minTick === undefined) {
      return
    }

    const result = navigateTick({
      currentTick: minTick,
      direction: 'decrement',
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      protocolVersion,
      liquidityData: renderingContext?.liquidityData,
    })
    if (!result) {
      return
    }

    const newTick = result.tick

    actions.setChartState({ minTick: newTick })
    actions.handleTickChange({ changeType: 'min', tick: newTick })
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
