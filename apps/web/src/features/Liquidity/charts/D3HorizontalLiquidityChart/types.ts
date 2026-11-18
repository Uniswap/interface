import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import type * as d3 from 'd3'
import type { ChartCoreActions } from '~/features/Liquidity/charts/D3LiquidityChartShared/store/createChartActions'
import type { LinearTickScale, Renderer } from '~/features/Liquidity/charts/D3LiquidityChartShared/types'
import type { BucketChartEntry } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'
import type { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import type { TickData } from '~/features/Liquidity/types/ticks'

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
  /** The hovered bar's tick range, highlighted: a grouped bar's bucket, else its segment (every bar in it) */
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
  /** Vertical space (px) kept clear at the top of the chart for an overlaid header; bars draw below it. */
  topInset: number
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
  /** Ephemeral state for smoothing the liquidity height-scale during scroll (see HorizontalLiquidityBarsRenderer). */
  liquidityScaleSmoothing: HorizontalLiquidityScaleSmoothing
  /** Groups ticks into `DESIRED_BUCKETS` bars; off draws one bar per tick spacing (full granularity). */
  groupTicks: boolean
  /** A grouped bar's hover, highlight and amounts cover its whole bucket rather than its segment. */
  bucketScopedBars: boolean
}

/**
 * Ephemeral, view-only state used to low-pass the liquidity height-scale while scrolling.
 * Lives on a stable ref (not in the store) so it survives the per-frame renderer re-init,
 * without triggering React re-renders. See HorizontalLiquidityBarsRenderer for how it's applied.
 */
export type HorizontalLiquidityScaleSmoothing = {
  /** Eased max-liquidity currently driving bar heights; undefined until the first draw / after reset. */
  displayedMaxLiquidity?: number
  /** Timestamp (ms) of the previous draw, for frame-rate-independent easing. */
  lastFrameTimeMs?: number
  /** Pending requestAnimationFrame id for the post-scroll settle loop. */
  settleFrameId?: number
}

export type { Renderer }

export type HorizontalLiquidityChartStoreState = HorizontalLiquidityChartState & {
  renderers: {
    liquidityBarsRenderer: Renderer | null
  }
  renderingContext: HorizontalLiquidityRenderingContext | null
  actions: HorizontalLiquidityChartActions
}
