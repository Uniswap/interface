import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { PriceChartData } from 'components/Charts/PriceChart'
import * as d3 from 'd3'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'

export type ChartState = {
  zoomLevel: number
  panY: number
  minPrice: number | null
  maxPrice: number | null
  initialViewSet: boolean
  dimensions: {
    width: number
    height: number
  }
}

export type RenderingContext = {
  colors: UseSporeColorsReturn
  dimensions: {
    width: number
    height: number
  }
  priceData: PriceChartData[]
  liquidityData: ChartEntry[]
  tickScale: ((tick: string) => number) & {
    domain: () => string[]
    bandwidth: () => number
    range: () => [number, number]
  }
  priceToY: (price: number) => number
}

export interface Renderer {
  draw(): void
}

type Renderers = {
  priceLineRenderer: Renderer | null
  liquidityBarsRenderer: Renderer | null
  liquidityRangeAreaRenderer: Renderer | null
  minMaxPriceLineRenderer: Renderer | null
}

export type ChartActions = {
  setChartState: (state: Partial<ChartState>) => void
  setDefaultState: (state: ChartState) => void
  updateDimensions: (dimensions: { width: number; height: number }) => void
  initializeView: (priceData: PriceChartData[], liquidityData: ChartEntry[]) => void
  initializeRenderers: (g: d3.Selection<SVGGElement, unknown, null, undefined>, context: RenderingContext) => void
  drawAll: () => void
}

export type ChartStoreState = ChartState & {
  defaultState: ChartState
  renderers: Renderers
  renderingContext: RenderingContext | null
  actions: ChartActions
}
