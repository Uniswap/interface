import { createCurrentTickRenderer } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/CurrentTickRenderer'
import { createLiquidityBarsOverlayRenderer } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/LiquidityBarsOverlayRenderer'
import { createLiquidityBarsRenderer } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/LiquidityBarsRenderer'
import { createLiquidityRangeAreaRenderer } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/LiquidityRangeAreaRenderer'
import { createMinMaxPriceIndicatorsRenderer } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/MinMaxPriceIndicatorsRenderer'
import { createMinMaxPriceLineRenderer } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/MinMaxPriceLineRenderer'
import { createPriceLineRenderer } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/PriceLineRenderer'
import { createScrollbarContainerRenderer } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/ScrollbarContainerRenderer'
import { createTimescaleRenderer } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/TimescaleRenderer'
import type {
  ChartStoreState,
  RenderingContext,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'

export const createRenderActions = (
  set: (fn: (state: ChartStoreState) => ChartStoreState) => void,
  get: () => ChartStoreState,
) => ({
  initializeRenderers: ({
    g,
    timescaleG,
    context,
  }: {
    g: d3.Selection<SVGGElement, unknown, null, undefined>
    timescaleG: d3.Selection<SVGGElement, unknown, null, undefined>
    context: RenderingContext
  }) => {
    const getState = () => {
      const state = get()
      return {
        baseCurrency: state.baseCurrency,
        quoteCurrency: state.quoteCurrency,
        dimensions: state.dimensions,
        dragStartY: state.dragStartY,
        initialViewSet: state.initialViewSet,
        inputMode: state.inputMode,
        isFullRange: state.isFullRange,
        maxPrice: state.maxPrice,
        minPrice: state.minPrice,
        minTick: state.minTick,
        maxTick: state.maxTick,
        panY: state.panY,
        priceInverted: state.priceInverted,
        protocolVersion: state.protocolVersion,
        renderedBuckets: state.renderedBuckets,
        hoveredSegment: state.hoveredSegment,
        selectedHistoryDuration: state.selectedHistoryDuration,
        tickSpacing: state.tickSpacing,
        zoomLevel: state.zoomLevel,
      }
    }

    const getActions = () => get().actions

    const priceLineRenderer = createPriceLineRenderer({ g, context, getState })
    const liquidityBarsRenderer = createLiquidityBarsRenderer({ g, context, getState, getActions })
    const liquidityRangeAreaRenderer = createLiquidityRangeAreaRenderer({ g, context, getState, getActions })
    const minMaxPriceLineRenderer = createMinMaxPriceLineRenderer({ g, context, getState, getActions })
    const scrollbarContainerRenderer = createScrollbarContainerRenderer({ g, context })
    const minMaxPriceIndicatorsRenderer = createMinMaxPriceIndicatorsRenderer({
      g,
      context,
      getState,
      getActions,
    })
    const currentTickRenderer = createCurrentTickRenderer({ g, context, getState })
    const liquidityBarsOverlayRenderer = createLiquidityBarsOverlayRenderer({
      g,
      context,
      getState,
      getActions,
    })
    const timescaleRenderer = createTimescaleRenderer({ g: timescaleG, context })

    set((state) => ({
      ...state,
      renderers: {
        priceLineRenderer,
        liquidityBarsRenderer,
        liquidityRangeAreaRenderer,
        minMaxPriceLineRenderer,
        scrollbarContainerRenderer,
        minMaxPriceIndicatorsRenderer,
        currentTickRenderer,
        liquidityBarsOverlayRenderer,
        timescaleRenderer,
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
    if (renderers.scrollbarContainerRenderer) {
      renderers.scrollbarContainerRenderer.draw()
    }
    if (renderers.minMaxPriceIndicatorsRenderer) {
      renderers.minMaxPriceIndicatorsRenderer.draw()
    }
    if (renderers.currentTickRenderer) {
      renderers.currentTickRenderer.draw()
    }
    if (renderers.liquidityBarsOverlayRenderer) {
      renderers.liquidityBarsOverlayRenderer.draw()
    }
    if (renderers.timescaleRenderer) {
      renderers.timescaleRenderer.draw()
    }
  },
})
