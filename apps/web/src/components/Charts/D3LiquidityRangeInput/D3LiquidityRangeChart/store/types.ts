import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { TickAlignment } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceToY'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { PriceChartData } from 'components/Charts/PriceChart'
import { RangeAmountInputPriceMode } from 'components/Liquidity/Create/types'
import * as d3 from 'd3'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'

export type TickNavigationParams = {
  tickSpacing: number
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
}

export type ChartState = {
  dimensions: {
    width: number
    height: number
  }
  defaultMinPrice?: number
  defaultMaxPrice?: number
  dragCurrentTick?: ChartEntry
  dragCurrentY?: number
  dragStartTick?: ChartEntry
  dragStartY: number | null
  dynamicZoomMin: number
  hoveredTick?: ChartEntry
  hoveredY?: number
  initialViewSet: boolean
  inputMode: RangeAmountInputPriceMode
  isChartHovered?: boolean
  isFullRange: boolean
  maxPrice?: number
  minPrice?: number
  panY: number
  selectedHistoryDuration: GraphQLApi.HistoryDuration
  selectedPriceStrategy?: DefaultPriceStrategy
  zoomLevel: number
}

export type AnimationParams = {
  targetZoom: number
  targetPan: number
  targetMinPrice?: number
  targetMaxPrice?: number
  duration?: number
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
  priceToY: ({ price, tickAlignment }: { price: number; tickAlignment?: TickAlignment }) => number
  yToPrice: (y: number) => number
}

export enum DefaultPriceStrategy {
  STABLE = 'stable',
  WIDE = 'wide',
  ONE_SIDED_UPPER = 'one_sided_upper',
  ONE_SIDED_LOWER = 'one_sided_lower',
  FULL_RANGE = 'full_range',
  CUSTOM = 'custom',
}

export interface Renderer {
  draw(): void
}

type Renderers = {
  priceLineRenderer: Renderer | null
  liquidityBarsRenderer: Renderer | null
  liquidityRangeAreaRenderer: Renderer | null
  minMaxPriceLineRenderer: Renderer | null
  scrollbarContainerRenderer: Renderer | null
  minMaxPriceIndicatorsRenderer: Renderer | null
  currentTickRenderer: Renderer | null
  liquidityBarsOverlayRenderer: Renderer | null
  timescaleRenderer: Renderer | null
}

export type ChartActions = {
  setChartState: (state: Partial<ChartState>) => void
  setPriceStrategy: ({ priceStrategy, animate }: { priceStrategy: DefaultPriceStrategy; animate: boolean }) => void
  setTimePeriod: (timePeriod: GraphQLApi.HistoryDuration) => void
  syncIsFullRangeFromParent: (isFullRange: boolean) => void
  updateDimensions: (dimensions: { width: number; height: number }) => void
  handlePriceChange: (changeType: 'min' | 'max', price?: number) => void
  initializeView: (params?: { minPrice: number | null; maxPrice: number | null }) => void
  initializeRenderers: ({
    g,
    timescaleG,
    context,
  }: {
    g: d3.Selection<SVGGElement, unknown, null, undefined>
    timescaleG: d3.Selection<SVGGElement, unknown, null, undefined>
    context: RenderingContext
  }) => void
  createHandleDragBehavior: (lineType: 'min' | 'max') => d3.DragBehavior<any, unknown, unknown>
  createTickBasedDragBehavior: () => d3.DragBehavior<any, unknown, unknown>
  centerRange: () => void
  zoom: (targetZoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  reset: (params?: { animate?: boolean; minPrice?: number; maxPrice?: number }) => void
  drawAll: () => void
  animateToState: (params: AnimationParams) => void
  incrementMax: (params: TickNavigationParams) => void
  decrementMax: (params: TickNavigationParams) => void
  incrementMin: (params: TickNavigationParams) => void
  decrementMin: (params: TickNavigationParams) => void
  toggleInputMode: () => void
}

export type ChartStoreState = ChartState & {
  renderers: Renderers
  renderingContext: RenderingContext | null
  dynamicZoomMin: number
  actions: ChartActions
}
