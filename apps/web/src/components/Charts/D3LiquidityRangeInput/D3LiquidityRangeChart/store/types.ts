import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import * as d3 from 'd3'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { TickData } from '~/appGraphql/data/AllV3TicksQuery'
import { BucketChartEntry } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/liquidityBucketing/liquidityBucketing'
import { TickAlignment } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceToY'
import { ChartEntry } from '~/components/Charts/LiquidityRangeInput/types'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { RangeAmountInputPriceMode } from '~/components/Liquidity/Create/types'

/**
 * Linear tick scale that maps ticks to Y positions.
 * Unlike scaleBand, this supports any tick value (not just those in the data).
 */
export type LinearTickScale = {
  /** Convert a tick to Y position */
  tickToY: (tick: number) => number
  /** Convert Y position to tick */
  yToTick: (y: number) => number
  /** Min tick in the data range */
  minTick: number
  /** Max tick in the data range */
  maxTick: number
  /** Y range [top, bottom] */
  range: [number, number]
}

export type TickNavigationParams = {
  tickSpacing: number
  feeAmount?: number
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  protocolVersion: ProtocolVersion
}

export type ChartState = {
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
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
  hoveredTick?: ChartEntry
  hoveredY?: number
  /** The hovered segment's tick range - used for highlighting all buckets in the same segment */
  hoveredSegment?: { startTick: number; endTick: number }
  initialViewSet: boolean
  inputMode: RangeAmountInputPriceMode
  isChartHovered?: boolean
  isFullRange: boolean
  maxPrice?: number
  maxTick?: number
  minPrice?: number
  minTick?: number
  panY: number
  priceInverted: boolean
  protocolVersion: ProtocolVersion
  renderedBuckets?: BucketChartEntry[]
  selectedHistoryDuration: GraphQLApi.HistoryDuration
  selectedPriceStrategy?: DefaultPriceStrategy
  tickSpacing: number
  zoomLevel: number
}

export type AnimationParams = {
  targetZoom: number
  targetPan: number
  targetMinTick?: number
  targetMaxTick?: number
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
  rawTicks: TickData[]
  /** Linear tick scale for continuous tick-to-Y mapping */
  tickScale: LinearTickScale
  /** Pool tick spacing */
  tickSpacing: number
  /** Current tick derived from current price: Math.round(Math.log(currentPrice) / Math.log(1.0001)) */
  currentTick: number
  priceToY: ({ price, tickAlignment }: { price: number; tickAlignment?: TickAlignment }) => number
  tickToY: ({ tick, tickAlignment }: { tick: number; tickAlignment?: TickAlignment }) => number
  yToTick: (y: number) => number
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
  setChartError: (error: string) => void
  setChartState: (state: Omit<Partial<ChartState>, 'minPrice' | 'maxPrice'>) => void
  setPriceStrategy: ({ priceStrategy, animate }: { priceStrategy: DefaultPriceStrategy; animate: boolean }) => void
  setTimePeriod: (timePeriod: GraphQLApi.HistoryDuration) => void
  syncIsFullRangeFromParent: (isFullRange: boolean) => void
  updateDimensions: (dimensions: { width: number; height: number }) => void
  handleTickChange: ({ changeType, tick }: { changeType: 'min' | 'max'; tick?: number }) => void
  initializeView: () => void
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
  reset: (params?: { animate?: boolean; minTick?: number; maxTick?: number }) => void
  drawAll: () => void
  animateToState: (params: AnimationParams) => void
  incrementMax: (params: TickNavigationParams) => void
  decrementMax: (params: TickNavigationParams) => void
  incrementMin: (params: TickNavigationParams) => void
  decrementMin: (params: TickNavigationParams) => void
  toggleInputMode: () => void
}

export type ChartStoreState = ChartState & {
  priceInverted: boolean
  protocolVersion: ProtocolVersion
  renderers: Renderers
  renderingContext: RenderingContext | null
  actions: ChartActions
}
