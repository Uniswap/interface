import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import type { UTCTimestamp } from 'lightweight-charts'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { calculateRangeViewport } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/viewportUtils'
import {
  createParent,
  createRenderingContext,
  createStore,
  TICK_SPACING,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/test-utils/chartStoreHarness'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from '~/test-utils/constants'

function pricePoint(value: number, index: number): PriceChartData {
  return { time: index as UTCTimestamp, value, open: value, high: value, low: value, close: value }
}

// A sibling pool's history around a current price of 1, with no liquidity for the pool being created.
function createNewPoolContext() {
  const context = createRenderingContext({ currentTick: 0 })
  context.priceData = [0.9, 1.1, 1].map(pricePoint)
  context.liquidityData = []
  return context
}

describe('reset for a pool being created (price line, no liquidity data)', () => {
  it('initializes the view from the price data alone', () => {
    const parent = createParent({})
    const store = createStore({
      currentTick: 0,
      currentPrice: 1,
      baseCurrency: TEST_TOKEN_1,
      quoteCurrency: TEST_TOKEN_2,
      parent,
    })

    // Publishing a context is what triggers the store's own initializeView subscription.
    store.setState({ renderingContext: createNewPoolContext() })

    // NaN defaults fail every assertion below if the view never set a range.
    const { initialViewSet, minTick = NaN, maxTick = NaN } = store.getState()
    expect(initialViewSet).toBe(true)
    // A default range straddling the current tick, snapped to the new pool's spacing (abs: -600 % 60 is -0).
    expect(Math.abs(minTick % TICK_SPACING)).toBe(0)
    expect(Math.abs(maxTick % TICK_SPACING)).toBe(0)
    expect(minTick).toBeLessThan(0)
    expect(maxTick).toBeGreaterThan(0)
  })

  it('spans the whole usable tick range for full range instead of a distribution it does not have', () => {
    const parent = createParent({})
    const store = createStore({
      currentTick: 0,
      currentPrice: 1,
      isFullRange: true,
      baseCurrency: TEST_TOKEN_1,
      quoteCurrency: TEST_TOKEN_2,
      parent,
    })

    store.setState({ renderingContext: createNewPoolContext() })

    expect(store.getState()).toMatchObject({
      initialViewSet: true,
      minTick: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACING),
      maxTick: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACING),
    })
  })
})

describe('reset without emitting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('recentres on the given range without sending it back to the parent', () => {
    const parent = createParent({})
    const onMinMaxTickChange = vi.spyOn(parent, 'onMinMaxTickChange')
    const store = createStore({
      currentTick: 0,
      currentPrice: 1,
      baseCurrency: TEST_TOKEN_1,
      quoteCurrency: TEST_TOKEN_2,
      parent,
    })
    store.setState({ renderingContext: createNewPoolContext() })
    vi.runAllTimers()
    onMinMaxTickChange.mockClear()

    const range = { minTick: -1200, maxTick: 1200 }
    store.getState().actions.reset({ animate: false, emit: false, ...range })
    vi.runAllTimers()

    const { targetZoom, targetPanY } = calculateRangeViewport({ ...range, tickSpacing: TICK_SPACING })
    expect(store.getState()).toMatchObject({ ...range, zoomLevel: targetZoom, panY: targetPanY })
    expect(onMinMaxTickChange).not.toHaveBeenCalled()
  })
})
