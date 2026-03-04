import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { createDragActions } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/actions/dragActions'
import { createPriceActions } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/actions/priceActions'
import { createRenderActions } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/actions/renderActions'
import { createViewActions } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/actions/viewActions'
import {
  ChartState,
  ChartStoreState,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { ChartEntry } from '~/components/Charts/LiquidityRangeInput/types'
import { RangeAmountInputPriceMode } from '~/components/Liquidity/Create/types'
import { getDisplayPriceFromTick } from '~/utils/getTickToPrice'

// Organized initial state by domain
const INITIAL_VIEW_STATE = {
  dimensions: {
    height: 0,
    width: 0,
  },
  initialViewSet: false,
  inputMode: RangeAmountInputPriceMode.PRICE,
  panY: 0,
  zoomLevel: 1,
}

const INITIAL_PRICE_STATE = {
  isFullRange: false,
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
  inputMode,
  minTick,
  maxTick,
  tickSpacing,
  baseCurrency,
  quoteCurrency,
  priceInverted,
  protocolVersion,
  isFullRange,
  selectedHistoryDuration,
  onChartError,
  onInputModeChange,
  onMinTickChange,
  onMaxTickChange,
  onTimePeriodChange,
  setIsFullRange,
}: {
  inputMode?: RangeAmountInputPriceMode
  minTick?: number
  maxTick?: number
  tickSpacing: number
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
  isFullRange?: boolean
  selectedHistoryDuration?: GraphQLApi.HistoryDuration
  onChartError: (error: string) => void
  onInputModeChange: (inputMode: RangeAmountInputPriceMode) => void
  onMinTickChange: (tick?: number) => void
  onMaxTickChange: (tick?: number) => void
  onTimePeriodChange?: (timePeriod: GraphQLApi.HistoryDuration) => void
  setIsFullRange: (isFullRange: boolean) => void
}) => {
  // Group callbacks for action creators
  const callbacks = {
    onChartError,
    onInputModeChange,
    onMinTickChange,
    onMaxTickChange,
    onTimePeriodChange,
  }

  const store = create<ChartStoreState>()(
    devtools(
      subscribeWithSelector((set, get) => {
        // Create all action groups
        const viewActions = createViewActions({ set, get, callbacks })
        const priceActions = createPriceActions({ set, get, callbacks })
        const dragActions = createDragActions(get)
        const renderActions = createRenderActions(set, get)

        return {
          minTick,
          maxTick,
          minPrice: getDisplayPriceFromTick({
            tick: minTick,
            baseCurrency,
            quoteCurrency,
            priceInverted,
            protocolVersion,
          }),
          maxPrice: getDisplayPriceFromTick({
            tick: maxTick,
            baseCurrency,
            quoteCurrency,
            priceInverted,
            protocolVersion,
          }),
          baseCurrency,
          quoteCurrency,
          priceInverted,
          protocolVersion,
          tickSpacing,
          // Price state (with overrides from props)
          isFullRange: isFullRange ?? INITIAL_PRICE_STATE.isFullRange,
          selectedHistoryDuration: selectedHistoryDuration ?? INITIAL_PRICE_STATE.selectedHistoryDuration,

          // View state
          ...INITIAL_VIEW_STATE,
          inputMode: inputMode ?? INITIAL_VIEW_STATE.inputMode,

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
            setChartError: (error: string) => {
              callbacks.onChartError(error)
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

  // Sync isFullRange changes back to parent
  store.subscribe(
    (state) => state.isFullRange,
    (isFullRange) => {
      setIsFullRange(isFullRange)
    },
  )

  // Set minPrice and maxPrice from minTick and maxTick
  store.subscribe(
    (state) => state.minTick,
    (minTick) => {
      if (minTick === undefined) {
        return
      }
      const { baseCurrency, quoteCurrency, priceInverted, protocolVersion } = store.getState()

      const price = getDisplayPriceFromTick({
        tick: minTick,
        baseCurrency,
        quoteCurrency,
        priceInverted,
        protocolVersion,
      })
      // @ts-expect-error: minPrice can be set here
      store.getState().actions.setChartState({ minPrice: price })
    },
  )
  store.subscribe(
    (state) => state.maxTick,
    (maxTick) => {
      if (maxTick === undefined) {
        return
      }
      const { baseCurrency, quoteCurrency, priceInverted, protocolVersion } = store.getState()

      const price = getDisplayPriceFromTick({
        tick: maxTick,
        baseCurrency,
        quoteCurrency,
        priceInverted,
        protocolVersion,
      })
      // @ts-expect-error: maxPrice can be set here
      store.getState().actions.setChartState({ maxPrice: price })
    },
  )

  return store
}
