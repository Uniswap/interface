import { CHART_BEHAVIOR } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { createCurrentTickRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/CurrentTickRenderer'
import { createLiquidityBarsOverlayRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/LiquidityBarsOverlayRenderer'
import { createLiquidityBarsRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/LiquidityBarsRenderer'
import { createLiquidityRangeAreaRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/LiquidityRangeAreaRenderer'
import { createMinMaxPriceIndicatorsRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/MinMaxPriceIndicatorsRenderer'
import { createMinMaxPriceLineRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/MinMaxPriceLineRenderer'
import { createPriceLineRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/PriceLineRenderer'
import { createScrollbarContainerRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/ScrollbarContainerRenderer'
import { createTimescaleRenderer } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/renderers/TimescaleRenderer'
import type {
  AnimationParams,
  ChartStoreState,
  RenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getClosestTick } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/getClosestTick'
import * as d3 from 'd3'

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
        dimensions: state.dimensions,
        dragStartY: state.dragStartY,
        dynamicZoomMin: state.dynamicZoomMin,
        initialViewSet: state.initialViewSet,
        inputMode: state.inputMode,
        isFullRange: state.isFullRange,
        maxPrice: state.maxPrice,
        minPrice: state.minPrice,
        panY: state.panY,
        selectedHistoryDuration: state.selectedHistoryDuration,
        zoomLevel: state.zoomLevel,
      }
    }

    const getActions = () => get().actions

    const priceLineRenderer = createPriceLineRenderer({ g, context, getState })
    const liquidityBarsRenderer = createLiquidityBarsRenderer({ g, context, getState })
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
    const timescaleRenderer = createTimescaleRenderer({ g: timescaleG, context, getState })

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

  animateToState: ({
    targetZoom,
    targetPan,
    targetMinPrice,
    targetMaxPrice,
    duration = CHART_BEHAVIOR.ANIMATION_DURATION,
  }: AnimationParams) => {
    const { zoomLevel, panY, minPrice, maxPrice, renderingContext } = get()

    if (!renderingContext) {
      return
    }

    const startZoom = zoomLevel
    const startPan = panY
    const startMinPrice = minPrice ?? 0
    const startMaxPrice = maxPrice ?? 0
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Modern easeOutQuart for snappy, smooth feel
      const easeProgress = 1 - Math.pow(1 - progress, 4)
      // Interpolate zoom and pan values
      const currentZoom = startZoom + (targetZoom - startZoom) * easeProgress
      const currentPan = startPan + (targetPan - startPan) * easeProgress
      // Interpolate price range if targets provided
      let currentMinPrice = startMinPrice
      let currentMaxPrice = startMaxPrice
      if (targetMinPrice !== undefined && targetMaxPrice !== undefined) {
        currentMinPrice = startMinPrice + (targetMinPrice - startMinPrice) * easeProgress
        currentMaxPrice = startMaxPrice + (targetMaxPrice - startMaxPrice) * easeProgress
      }

      const { tick: minTick } = getClosestTick(renderingContext.liquidityData, currentMinPrice)
      const { tick: maxTick } = getClosestTick(renderingContext.liquidityData, currentMaxPrice)
      set((state) => ({
        ...state,
        zoomLevel: currentZoom,
        panY: currentPan,
        minPrice: minTick.price0,
        maxPrice: maxTick.price0,
      }))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  },
})
