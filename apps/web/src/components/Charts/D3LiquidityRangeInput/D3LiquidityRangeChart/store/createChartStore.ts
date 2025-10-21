import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { createLiquidityBarsRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/LiquidityBarsRenderer'
import { createLiquidityRangeAreaRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/LiquidityRangeAreaRenderer'
import { createMinMaxPriceLineRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/MinMaxPriceLineRenderer'
import { createPriceLineRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/PriceLineRenderer'
import type {
  ChartState,
  ChartStoreState,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { PriceChartData } from 'components/Charts/PriceChart'
import * as d3 from 'd3'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

const INITIAL_CHART_STATE: ChartState = {
  zoomLevel: 1,
  panY: 0,
  minPrice: null,
  maxPrice: null,
  initialViewSet: false,
  dimensions: {
    width: 0,
    height: 0,
  },
}

export type ChartStore = UseBoundStore<StoreApi<ChartStoreState>>

export const createChartStore = ({
  priceData,
  liquidityData,
}: {
  priceData?: PriceChartData[]
  liquidityData?: ChartEntry[]
} = {}): ChartStore => {
  const store = create<ChartStoreState>()(
    devtools(
      subscribeWithSelector((set, get) => ({
        // Initial state
        zoomLevel: INITIAL_CHART_STATE.zoomLevel,
        panY: INITIAL_CHART_STATE.panY,
        minPrice: INITIAL_CHART_STATE.minPrice,
        maxPrice: INITIAL_CHART_STATE.maxPrice,
        initialViewSet: INITIAL_CHART_STATE.initialViewSet,
        dimensions: INITIAL_CHART_STATE.dimensions,
        defaultState: { ...INITIAL_CHART_STATE },

        // Renderers
        renderers: {
          priceLineRenderer: null,
          liquidityBarsRenderer: null,
          liquidityRangeAreaRenderer: null,
          minMaxPriceLineRenderer: null,
        },
        renderingContext: null,

        // Actions
        actions: {
          setChartState: (newState: Partial<ChartState>) => {
            set((state) => ({ ...state, ...newState }))
          },

          setDefaultState: (defaultState: ChartState) => {
            set((state) => ({ ...state, defaultState }))
          },

          updateDimensions: (dimensions: { width: number; height: number }) => {
            set((state) => ({ ...state, dimensions }))
            const { actions } = get()
            actions.drawAll()
          },

          initializeView: (priceData: PriceChartData[], liquidityData: ChartEntry[]) => {
            const { initialViewSet } = get()
            if (!initialViewSet && liquidityData.length > 0) {
              // Find current price tick index in the liquidity data
              const currentPrice = priceData[priceData.length - 1]?.value || 0
              const currentTickIndex = liquidityData.findIndex(
                (d) =>
                  Math.abs(d.price0 - currentPrice) ===
                  Math.min(...liquidityData.map((item) => Math.abs(item.price0 - currentPrice))),
              )

              // Set initial zoom based on the selected range (±10% of current price)
              const currentPriceValue = liquidityData[currentTickIndex]?.price0 || currentPrice
              const defaultMinPrice = currentPriceValue * 0.9 // 10% below current price
              const defaultMaxPrice = currentPriceValue * 1.1 // 10% above current price

              // Find the ticks that correspond to our selected range - same logic as Center Range
              const minPriceTick = liquidityData.reduce((prev, curr) =>
                Math.abs(curr.price0 - defaultMinPrice) < Math.abs(prev.price0 - defaultMinPrice) ? curr : prev,
              )
              const maxPriceTick = liquidityData.reduce((prev, curr) =>
                Math.abs(curr.price0 - defaultMaxPrice) < Math.abs(prev.price0 - defaultMaxPrice) ? curr : prev,
              )

              const minTickIndex = liquidityData.findIndex((d) => d.tick === minPriceTick.tick)
              const maxTickIndex = liquidityData.findIndex((d) => d.tick === maxPriceTick.tick)
              const rangeCenterIndex = (minTickIndex + maxTickIndex) / 2
              const rangeSpanInTicks = Math.abs(maxTickIndex - minTickIndex)

              // Calculate zoom level to fit the selected range in viewport with padding
              const viewportHeight = CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT
              const barHeight = CHART_DIMENSIONS.LIQUIDITY_BAR_HEIGHT + CHART_DIMENSIONS.LIQUIDITY_BAR_SPACING
              const ticksVisibleInViewport = viewportHeight / barHeight
              const paddingFactor = 2.5 // Show 150% more than the range for context
              const requiredTicks = rangeSpanInTicks * paddingFactor

              // Calculate zoom using same logic as Center Range
              const desiredZoom = Math.max(ticksVisibleInViewport / requiredTicks, 0.01)

              // Calculate panY to center the selected range in the viewport
              const rangeCenterY = (liquidityData.length - 1 - rangeCenterIndex) * barHeight * desiredZoom
              const centerPanY = viewportHeight / 2 - rangeCenterY

              // Update both current state and default state
              const newState = {
                zoomLevel: desiredZoom,
                panY: centerPanY,
                minPrice: defaultMinPrice,
                maxPrice: defaultMaxPrice,
                initialViewSet: true,
              }

              set((state) => ({
                ...state,
                ...newState,
              }))
            }
          },

          initializeRenderers: (g: d3.Selection<SVGGElement, unknown, null, undefined>, context: RenderingContext) => {
            const getState = () => {
              const state = get()
              return {
                minPrice: state.minPrice,
                maxPrice: state.maxPrice,
                dimensions: state.dimensions,
              }
            }

            const priceLineRenderer = createPriceLineRenderer({ g, context, getState })
            const liquidityBarsRenderer = createLiquidityBarsRenderer({ g, context, getState })
            const liquidityRangeAreaRenderer = createLiquidityRangeAreaRenderer({ g, context, getState })
            const minMaxPriceLineRenderer = createMinMaxPriceLineRenderer({ g, context, getState })

            set((state) => ({
              ...state,
              renderers: {
                priceLineRenderer,
                liquidityBarsRenderer,
                liquidityRangeAreaRenderer,
                minMaxPriceLineRenderer,
              },
              renderingContext: context,
            }))
          },

          drawAll: () => {
            const { renderers } = get()
            if (renderers.priceLineRenderer) {
              renderers.priceLineRenderer.draw()
            }
            if (renderers.liquidityBarsRenderer) {
              renderers.liquidityBarsRenderer.draw()
            }
            if (renderers.liquidityRangeAreaRenderer) {
              renderers.liquidityRangeAreaRenderer.draw()
            }
            if (renderers.minMaxPriceLineRenderer) {
              renderers.minMaxPriceLineRenderer.draw()
            }
          },
        },
      })),
      {
        name: 'useChartStore',
        enabled: process.env.NODE_ENV === 'development',
        trace: true,
        traceLimit: 25,
      },
    ),
  )

  // Auto-initialize if data is provided
  if (priceData && liquidityData && liquidityData.length > 0 && priceData.length > 0) {
    store.getState().actions.initializeView(priceData, liquidityData)
  }

  return store
}
