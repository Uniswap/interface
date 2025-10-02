import { GraphQLApi } from '@universe/api'
import { CHART_BEHAVIOR } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { createDragActions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/actions/dragActions'
import { createPriceActions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/actions/priceActions'
import { createRenderActions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/actions/renderActions'
import { createViewActions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/actions/viewActions'
import { ChartState, ChartStoreState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

// Organized initial state by domain
const INITIAL_VIEW_STATE = {
  dimensions: {
    height: 0,
    width: 0,
  },
  dynamicZoomMin: CHART_BEHAVIOR.ZOOM_MIN,
  initialViewSet: false,
  panY: 0,
  zoomLevel: 1,
}

const INITIAL_PRICE_STATE = {
  isFullRange: false,
  maxPrice: undefined,
  minPrice: undefined,
  panY: 0,
  selectedHistoryDuration: GraphQLApi.HistoryDuration.Month,
  selectedPriceStrategy: undefined,
  zoomLevel: 1,
}

const INITIAL_DRAG_STATE = {
  dragStartY: null as number | null,
  dragCurrentY: undefined as number | undefined,
  dragStartTick: undefined as ChartEntry | undefined,
  dragCurrentTick: undefined as ChartEntry | undefined,
}

const INITIAL_HOVER_STATE = {
  hoveredY: undefined as number | undefined,
  hoveredTick: undefined as ChartEntry | undefined,
  isChartHovered: false,
}

export type ChartStore = UseBoundStore<StoreApi<ChartStoreState>>

export const createLiquidityChartStore = ({
  minPrice,
  maxPrice,
  isFullRange,
  selectedHistoryDuration,
  onMinPriceChange,
  onMaxPriceChange,
  onTimePeriodChange,
  setIsFullRange,
}: {
  minPrice?: number
  maxPrice?: number
  isFullRange?: boolean
  selectedHistoryDuration?: GraphQLApi.HistoryDuration
  onMinPriceChange: (price?: number) => void
  onMaxPriceChange: (price?: number) => void
  onTimePeriodChange?: (timePeriod: GraphQLApi.HistoryDuration) => void
  setIsFullRange: (isFullRange: boolean) => void
}) => {
  // Group callbacks for action creators
  const callbacks = {
    onMinPriceChange,
    onMaxPriceChange,
    onTimePeriodChange,
  }

  const store = create<ChartStoreState>()(
    devtools(
      subscribeWithSelector((set, get) => {
        // Create all action groups
        const viewActions = createViewActions(set, get)
        const priceActions = createPriceActions({ set, get, callbacks })
        const dragActions = createDragActions(get)
        const renderActions = createRenderActions(set, get)

        return {
          minPrice,
          maxPrice,
          // Price state (with overrides from props)
          isFullRange: isFullRange ?? INITIAL_PRICE_STATE.isFullRange,
          selectedHistoryDuration: selectedHistoryDuration ?? INITIAL_PRICE_STATE.selectedHistoryDuration,

          // View state
          ...INITIAL_VIEW_STATE,

          // Drag state
          ...INITIAL_DRAG_STATE,

          // Hover state
          ...INITIAL_HOVER_STATE,

          // Renderers
          renderers: {
            priceLineRenderer: null,
            liquidityBarsRenderer: null,
            liquidityRangeAreaRenderer: null,
            minMaxPriceLineRenderer: null,
            minMaxPriceIndicatorsRenderer: null,
            scrollbarContainerRenderer: null,
            currentTickRenderer: null,
            liquidityBarsOverlayRenderer: null,
            timescaleRenderer: null,
          },
          renderingContext: null,

          // Compose actions from all action groups
          actions: {
            setChartState: (newState: Partial<ChartState>) => {
              set((state) => ({ ...state, ...newState }))
            },

            // Core actions that stay in main file
            setTimePeriod: (timePeriod: GraphQLApi.HistoryDuration) => {
              set((state) => ({ ...state, selectedHistoryDuration: timePeriod }))
              if (callbacks.onTimePeriodChange) {
                callbacks.onTimePeriodChange(timePeriod)
              }
            },

            // Spread all action groups
            ...viewActions,
            ...priceActions,
            ...dragActions,
            ...renderActions,
          },
        }
      }),
      {
        name: 'useLiquidityChartStore',
        enabled: process.env.NODE_ENV === 'development',
        trace: true,
        traceLimit: 25,
      },
    ),
  )

  // Auto-initialize when renderingContext becomes available
  store.subscribe(
    (state) => state.renderingContext,
    (renderingContext, previousRenderingContext) => {
      // Only initialize if:
      // 1. We have a renderingContext
      // 2. The context has valid data
      // 3. Initial view hasn't been set yet
      if (
        renderingContext &&
        !previousRenderingContext &&
        renderingContext.priceData.length > 0 &&
        renderingContext.liquidityData.length > 0 &&
        !store.getState().initialViewSet
      ) {
        store.getState().actions.initializeView()
      }
    },
  )

  // Reset when isFullRange changes
  store.subscribe(
    (state) => state.isFullRange,
    (isFullRange) => {
      setIsFullRange(isFullRange)
      store.getState().actions.reset({ animate: false })
    },
  )

  return store
}
