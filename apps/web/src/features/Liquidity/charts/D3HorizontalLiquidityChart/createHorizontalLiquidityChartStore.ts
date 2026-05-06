import type * as d3 from 'd3'
import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { createHorizontalLiquidityBarsRenderer } from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/renderers/HorizontalLiquidityBarsRenderer'
import type {
  HorizontalLiquidityChartState,
  HorizontalLiquidityChartStoreState,
  HorizontalLiquidityRenderingContext,
} from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/types'
import { createChartActions } from '~/features/Liquidity/charts/D3LiquidityChartShared/store/createChartActions'
import {
  calculateHorizontalMaxZoom,
  calculateHorizontalViewport,
} from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/viewportUtils'

type HorizontalLiquidityChartStore = UseBoundStore<StoreApi<HorizontalLiquidityChartStoreState>>

const TICK_PADDING = 50

function getDefaultViewport(
  renderingContext: HorizontalLiquidityRenderingContext,
  chartWidth: number,
): { targetZoom: number; targetPanX: number } {
  const { currentTick, tickSpacing } = renderingContext
  const minTick = currentTick - TICK_PADDING * tickSpacing
  const maxTick = currentTick + TICK_PADDING * tickSpacing
  return calculateHorizontalViewport({ minTick, maxTick, tickSpacing, chartWidth })
}

export function createHorizontalLiquidityChartStore(): HorizontalLiquidityChartStore {
  const store = create<HorizontalLiquidityChartStoreState>()(
    devtools(
      subscribeWithSelector((set, get) => {
        const coreActions = createChartActions<HorizontalLiquidityChartStoreState>({
          set,
          get,
          getPan: (state) => state.panX,
          getViewportSize: (state) => state.dimensions.width,
          getContentSize: (state) => state.dimensions.width,
          setPan: (state, pan) => ({ ...state, panX: pan }),
          calculateMaxZoom: calculateHorizontalMaxZoom,
        })

        return {
          // State
          dimensions: { width: 0, height: 0 },
          zoomLevel: 1,
          panX: 0,
          initialViewSet: false,
          tickScale: undefined,
          renderedBuckets: undefined,
          hoveredTick: undefined,
          hoveredX: undefined,
          hoveredSegment: undefined,
          isChartHovered: false,

          // Renderers
          renderers: {
            liquidityBarsRenderer: null,
          },
          renderingContext: null,

          // Actions
          actions: {
            setChartState: (newState: Partial<HorizontalLiquidityChartState>) => {
              set((state) => ({ ...state, ...newState }))
            },

            initializeRenderers: ({
              g,
              context,
            }: {
              g: d3.Selection<SVGGElement, unknown, null, undefined>
              context: HorizontalLiquidityRenderingContext
            }) => {
              const getState = () => {
                const state = get()
                return {
                  dimensions: state.dimensions,
                  hoveredSegment: state.hoveredSegment,
                  isChartHovered: state.isChartHovered,
                  renderedBuckets: state.renderedBuckets,
                  tickScale: state.tickScale,
                }
              }

              const getActions = () => get().actions

              const liquidityBarsRenderer = createHorizontalLiquidityBarsRenderer({
                g,
                context,
                getState,
                getActions,
              })

              set((state) => ({
                ...state,
                renderers: { liquidityBarsRenderer },
                renderingContext: context,
              }))
            },

            initializeView: () => {
              const { initialViewSet, renderingContext, dimensions } = get()
              if (!renderingContext || initialViewSet) {
                return
              }

              if (renderingContext.liquidityData.length === 0 || dimensions.width === 0) {
                return
              }

              const { targetZoom, targetPanX } = getDefaultViewport(renderingContext, dimensions.width)

              set((state) => ({
                ...state,
                zoomLevel: targetZoom,
                panX: targetPanX,
                initialViewSet: true,
              }))
            },

            drawAll: () => {
              const { renderers } = get()
              renderers.liquidityBarsRenderer?.draw()
            },

            zoom: coreActions.zoom,
            zoomIn: coreActions.zoomIn,
            zoomOut: coreActions.zoomOut,
            animateToState: coreActions.animateToState,

            resetView: () => {
              const { renderingContext, dimensions, actions } = get()
              if (!renderingContext) {
                return
              }

              const { targetZoom, targetPanX } = getDefaultViewport(renderingContext, dimensions.width)

              actions.animateToState({
                targetZoom,
                targetPan: targetPanX,
              })
            },

            updateDimensions: (dimensions: { width: number; height: number }) => {
              set((state) => ({ ...state, dimensions }))
            },
          },
        }
      }),
      {
        name: 'useHorizontalLiquidityChartStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )

  // Auto-initialize when renderingContext becomes available
  store.subscribe(
    (state) => state.renderingContext,
    (renderingContext, previousRenderingContext) => {
      if (
        renderingContext &&
        !previousRenderingContext &&
        renderingContext.liquidityData.length > 0 &&
        !store.getState().initialViewSet
      ) {
        store.getState().actions.initializeView()
      }
    },
  )

  return store
}
