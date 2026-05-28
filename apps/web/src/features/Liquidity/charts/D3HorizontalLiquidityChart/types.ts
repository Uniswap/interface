import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import type * as d3 from 'd3'
import type { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import type { TickData } from '~/appGraphql/data/AllV3TicksQuery'
import type { ChartCoreActions } from '~/features/Liquidity/charts/D3LiquidityChartShared/store/createChartActions'
import type { LinearTickScale, Renderer } from '~/features/Liquidity/charts/D3LiquidityChartShared/types'
import type { BucketChartEntry } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import type { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'

export type HorizontalLiquidityChartState = {
  dimensions: {
    width: number
    height: number
  }
  zoomLevel: number
  panX: number
  initialViewSet: boolean
  /** Latest tick scale — updated on every zoom/pan frame so renderers always use current values */
  tickScale?: LinearTickScale
  renderedBuckets?: BucketChartEntry[]
  hoveredTick?: ChartEntry
  hoveredX?: number
  /** The hovered segment's tick range - used for highlighting all buckets in the same segment */
  hoveredSegment?: { startTick: number; endTick: number }
  isChartHovered?: boolean
}

export type HorizontalLiquidityChartActions = ChartCoreActions & {
  setChartState: (state: Partial<HorizontalLiquidityChartState>) => void
  initializeRenderers: ({
    g,
    context,
  }: {
    g: d3.Selection<SVGGElement, unknown, null, undefined>
    context: HorizontalLiquidityRenderingContext
  }) => void
  initializeView: () => void
  drawAll: () => void
  resetView: () => void
  updateDimensions: (dimensions: { width: number; height: number }) => void
}

export type HorizontalLiquidityRenderingContext = {
  /** Unique ID per chart instance, used to namespace SVG IDs (clipPath) so multiple charts don't collide */
  chartId: string
  colors: UseSporeColorsReturn
  dimensions: {
    width: number
    height: number
  }
  liquidityData: ChartEntry[]
  rawTicks: TickData[]
  tickSpacing: number
  currentTick: number
  token0Color: string
  token1Color: string
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
}

export type { Renderer }

export type HorizontalLiquidityChartStoreState = HorizontalLiquidityChartState & {
  renderers: {
    liquidityBarsRenderer: Renderer | null
  }
  renderingContext: HorizontalLiquidityRenderingContext | null
  actions: HorizontalLiquidityChartActions
}
