import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { createLiquidityChartStore } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/createLiquidityChartStore'
import type {
  RenderingContext,
  TickRangeChange,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { clampMaxTick, clampMinTick, setMinMaxTickRange } from '~/features/Liquidity/utils/clampTickRange'

export const TICK_SPACING = 60

/**
 * Stands in for `RangeSelectionStep`'s `setMinTick` / `setMaxTick` handlers. It calls the same
 * exported `clampMinTick` / `clampMaxTick` reducers the real handlers use, so if that clamping
 * changes these tests move with it instead of passing against a parent that no longer exists.
 *
 * The important part is that each setter reads the state the previous one left, which is what
 * makes emitting a range as two separate updates lossy.
 */
export function createParent({
  minTick,
  maxTick,
  tickSpacing = TICK_SPACING,
}: {
  minTick?: number
  maxTick?: number
  tickSpacing?: number
}) {
  const state = { minTick, maxTick }
  return {
    state,
    onMinTickChange: (tick?: number) => {
      state.minTick = clampMinTick({ tick, maxTick: state.maxTick, tickSpacing })
    },
    onMaxTickChange: (tick?: number) => {
      state.maxTick = clampMaxTick({ tick, minTick: state.minTick, tickSpacing })
    },
    onMinMaxTickChange: ({ minTick: nextMinTick, maxTick: nextMaxTick }: TickRangeChange) => {
      Object.assign(state, setMinMaxTickRange({ prev: state, minTick: nextMinTick, maxTick: nextMaxTick }))
    },
  }
}

export function createStore({
  currentTick,
  currentPrice,
  minTick,
  maxTick,
  creatingPoolOrPair = true,
  isFullRange,
  baseCurrency,
  quoteCurrency,
  parent,
}: {
  currentTick: number
  currentPrice?: number
  minTick?: number
  maxTick?: number
  creatingPoolOrPair?: boolean
  isFullRange?: boolean
  /** Left unset by default, which makes `reset` a no-op; pass real currencies to reach its tick math. */
  baseCurrency?: Maybe<Currency>
  quoteCurrency?: Maybe<Currency>
  parent: ReturnType<typeof createParent>
}) {
  return createLiquidityChartStore({
    currentTick,
    currentPrice,
    minTick,
    maxTick,
    tickSpacing: TICK_SPACING,
    baseCurrency,
    quoteCurrency,
    creatingPoolOrPair,
    isFullRange,
    priceInverted: false,
    protocolVersion: ProtocolVersion.V4,
    onChartError: () => {},
    onInputModeChange: () => {},
    onMinTickChange: parent.onMinTickChange,
    onMaxTickChange: parent.onMaxTickChange,
    onMinMaxTickChange: parent.onMinMaxTickChange,
    setIsFullRange: () => {},
  })
}

/**
 * Stands in for the context a mounted chart publishes, so tests can reach the paths that only run
 * on an established pool. The tick/Y mapping is linear (y = -tick, plus the spacing offset the
 * real projection adds for a 'top'-aligned handle) to keep the drag round-trips readable, and the
 * renderers are left null so `drawAll` is a no-op.
 */
export function createRenderingContext({ currentTick }: { currentTick: number }): RenderingContext {
  return {
    chartId: 'test',
    colors: {},
    dimensions: { width: 400, height: 400 },
    priceData: [],
    liquidityData: [],
    rawTicks: [],
    tickScale: { axisToTick: (y: number) => -y, tickToAxis: (tick: number) => -tick },
    tickSpacing: TICK_SPACING,
    currentTick,
    token0Color: '#000',
    token1Color: '#fff',
    priceToY: ({ price }: { price: number }) => -price,
    tickToY: ({ tick, tickAlignment }: { tick: number; tickAlignment?: string }) =>
      -(tick + (tickAlignment === 'top' ? TICK_SPACING : 0)),
    yToTick: (y: number) => -y,
    liquidityScaleSmoothing: {},
  } as unknown as RenderingContext
}
