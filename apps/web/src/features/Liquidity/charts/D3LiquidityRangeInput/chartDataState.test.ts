import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { nativeOnChain, USDC, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import {
  getChartDataState,
  getFallbackPriceInverted,
  getPriceLineSource,
  getPriceStrategiesState,
  usesFallbackPriceLine,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/chartDataState'

// Everything settled and present; each case flips the inputs it is about.
const SETTLED = {
  creatingPoolOrPair: false,
  poolHasNoActiveLiquidity: false,
  internalChartError: undefined,
  poolOrPairLoading: false,
  priceSourceLoading: false,
  priceQueryLoading: false,
  hasPriceData: true,
  hasPriceHistory: true,
  hasSiblingPool: true,
  hasOwnPositions: true,
  liquidityDataLoading: false,
  rawTicksLoading: false,
  hasLiquidityData: true,
}

// No sibling to borrow from means nothing was fetched, so there is no history either.
const NO_PRICE_LINE = { hasSiblingPool: false, hasPriceHistory: false }
// A pool that actually borrows holds no positions of its own to draw from.
const BORROWS = { poolHasNoActiveLiquidity: true, hasOwnPositions: false }

describe('getChartDataState', () => {
  describe('for a pool being created', () => {
    it('renders off the sibling pool with no liquidity data of its own', () => {
      expect(
        getChartDataState({
          ...SETTLED,
          creatingPoolOrPair: true,
          hasLiquidityData: false,
          liquidityDataLoading: false,
        }),
      ).toEqual({ showChartErrorView: false, isLoading: false })
    })

    it('waits on the sibling lookup rather than on liquidity that will never arrive', () => {
      expect(
        getChartDataState({ ...SETTLED, ...NO_PRICE_LINE, creatingPoolOrPair: true, priceSourceLoading: true }),
      ).toEqual({ showChartErrorView: false, isLoading: true })
      // Liquidity fetches are skipped while creating, so their state must not gate the chart.
      expect(
        getChartDataState({
          ...SETTLED,
          creatingPoolOrPair: true,
          liquidityDataLoading: true,
          rawTicksLoading: true,
          hasLiquidityData: false,
        }),
      ).toEqual({ showChartErrorView: false, isLoading: false })
    })

    it('still renders when a sibling exists but its series comes back empty', () => {
      // Long-standing behaviour for the create flow: the sibling's existence is the gate there, and an
      // empty series renders the lone live-price point rather than the inputs-only view.
      expect(
        getChartDataState({ ...SETTLED, creatingPoolOrPair: true, hasOwnPositions: false, hasPriceHistory: false }),
      ).toEqual({
        showChartErrorView: false,
        isLoading: false,
      })
    })

    it('falls back to the inputs-only view when the pair has no pool at any fee tier', () => {
      expect(getChartDataState({ ...SETTLED, ...NO_PRICE_LINE, creatingPoolOrPair: true })).toEqual({
        showChartErrorView: true,
        isLoading: false,
      })
    })
  })

  describe('for an initialized pool with no liquidity', () => {
    it('renders off the sibling pool with no distribution of its own', () => {
      // `hasPriceHistory` is the borrowed series, since that is the source this pool resolved to.
      expect(getChartDataState({ ...SETTLED, ...BORROWS, hasLiquidityData: false })).toEqual({
        showChartErrorView: false,
        isLoading: false,
      })
    })

    it('still renders when the sibling it borrows from has an empty series', () => {
      // CVX/USDT: every pool in the pair is empty, so the borrowed series comes back with no points
      // and the chart is just the appended live-price marker. Long-standing behaviour, and what keeps
      // this in step with the create flow for the same pair — which renders exactly the same thing.
      expect(getChartDataState({ ...SETTLED, ...BORROWS, hasPriceHistory: false, hasLiquidityData: false })).toEqual({
        showChartErrorView: false,
        isLoading: false,
      })
    })

    it('falls back to the inputs-only view when the source it picked has no series', () => {
      // A pool holding only out-of-range positions draws its OWN line, so a sibling it never reads
      // must not suppress the fallback — otherwise the chart renders off the live-price point alone.
      expect(
        getChartDataState({
          ...SETTLED,
          poolHasNoActiveLiquidity: true,
          hasOwnPositions: true,
          hasSiblingPool: true,
          hasPriceHistory: false,
          hasLiquidityData: false,
        }),
      ).toEqual({ showChartErrorView: true, isLoading: false })
    })

    it('keeps its own history when the pair has no other pool to borrow from', () => {
      expect(
        getChartDataState({
          ...SETTLED,
          poolHasNoActiveLiquidity: true,
          hasSiblingPool: false,
          hasLiquidityData: false,
        }),
      ).toEqual({ showChartErrorView: false, isLoading: false })
    })

    it('falls back to the inputs-only view with neither a sibling nor history of its own', () => {
      expect(getChartDataState({ ...SETTLED, ...NO_PRICE_LINE, ...BORROWS, hasLiquidityData: false })).toEqual({
        showChartErrorView: true,
        isLoading: false,
      })
    })

    it('waits for its own series before concluding there is no line to draw', () => {
      // With no sibling, the pool's own history is the last candidate — reading an in-flight series as
      // "no history" would flash the inputs-only view (and drop the range buttons) on the common path.
      expect(
        getChartDataState({
          ...SETTLED,
          ...NO_PRICE_LINE,
          ...BORROWS,
          hasLiquidityData: false,
          priceQueryLoading: true,
        }),
      ).toEqual({ showChartErrorView: false, isLoading: true })
    })

    it('waits on the sibling lookup as well as its own distribution', () => {
      // Zero active liquidity doesn't rule out positions parked outside the current tick, so those
      // fetches still run and still gate the chart.
      expect(getChartDataState({ ...SETTLED, ...NO_PRICE_LINE, ...BORROWS, priceSourceLoading: true })).toEqual({
        showChartErrorView: false,
        isLoading: true,
      })
      // ...but not once the source is pinned. `getPriceLineSource` resolves to this pool's own series
      // as soon as its ticks are in, so the sibling lookup's answer is unreachable — holding the
      // skeleton for it would blank a rendered chart every time a poll flips active liquidity to zero.
      expect(getChartDataState({ ...SETTLED, poolHasNoActiveLiquidity: true })).toEqual({
        showChartErrorView: false,
        isLoading: false,
      })
      expect(
        getChartDataState({ ...SETTLED, poolHasNoActiveLiquidity: true, liquidityDataLoading: true }),
      ).toMatchObject({
        isLoading: true,
      })
      expect(getChartDataState({ ...SETTLED, poolHasNoActiveLiquidity: true, rawTicksLoading: true })).toMatchObject({
        isLoading: true,
      })
    })
  })

  describe('for an existing pool', () => {
    it('renders once its own liquidity and price data are in', () => {
      expect(getChartDataState({ ...SETTLED, hasSiblingPool: false })).toEqual({
        showChartErrorView: false,
        isLoading: false,
      })
    })

    it('waits on its liquidity distribution and ticks', () => {
      expect(getChartDataState({ ...SETTLED, liquidityDataLoading: true })).toMatchObject({ isLoading: true })
      expect(getChartDataState({ ...SETTLED, rawTicksLoading: true })).toMatchObject({ isLoading: true })
    })

    it('shows the error view without a distribution, whatever the sibling lookup says', () => {
      expect(getChartDataState({ ...SETTLED, hasLiquidityData: false, hasSiblingPool: true })).toEqual({
        showChartErrorView: true,
        isLoading: false,
      })
    })
  })

  describe("for a migration drawing its source pool's series", () => {
    it('renders off that series when the pool has no history of its own and no sibling', () => {
      expect(getChartDataState({ ...SETTLED, ...BORROWS, hasSiblingPool: false, hasLiquidityData: false })).toEqual({
        showChartErrorView: false,
        isLoading: false,
      })
    })

    it('still falls back to the inputs-only view when the source series is empty too', () => {
      expect(
        getChartDataState({
          ...SETTLED,
          poolHasNoActiveLiquidity: true,
          hasPriceHistory: false,
          hasLiquidityData: false,
        }),
      ).toEqual({ showChartErrorView: true, isLoading: false })
    })
  })

  it('surfaces a chart error and missing price data for either kind of pool', () => {
    for (const creatingPoolOrPair of [true, false]) {
      expect(getChartDataState({ ...SETTLED, creatingPoolOrPair, internalChartError: 'boom' })).toMatchObject({
        showChartErrorView: true,
      })
      expect(getChartDataState({ ...SETTLED, creatingPoolOrPair, hasPriceData: false })).toMatchObject({
        showChartErrorView: true,
      })
      // Not an error while the pool or its prices are still loading.
      expect(
        getChartDataState({ ...SETTLED, creatingPoolOrPair, hasPriceData: false, priceQueryLoading: true }),
      ).toEqual({ showChartErrorView: false, isLoading: true })
    }
  })
})

describe('getPriceStrategiesState', () => {
  it('keeps the presets for a pool with no chart data of its own', () => {
    // The presets only need the current tick, so the inputs-only view doesn't take them away.
    for (const pool of [{ creatingPoolOrPair: true }, { poolHasNoActiveLiquidity: true }]) {
      expect(
        getPriceStrategiesState({ ...pool, showChartErrorView: true, poolOrPairLoading: false, chartLoading: true }),
      ).toEqual({ showPriceStrategies: true, priceStrategiesLoading: false })
    }
  })

  it('waits on the pool rather than the chart for those pools', () => {
    for (const pool of [{ creatingPoolOrPair: true }, { poolHasNoActiveLiquidity: true }]) {
      expect(
        getPriceStrategiesState({ ...pool, showChartErrorView: false, poolOrPairLoading: true, chartLoading: false }),
      ).toMatchObject({ priceStrategiesLoading: true })
    }
  })

  it('ties the presets to the chart for a pool with liquidity', () => {
    expect(
      getPriceStrategiesState({ showChartErrorView: true, poolOrPairLoading: false, chartLoading: false }),
    ).toEqual({ showPriceStrategies: false, priceStrategiesLoading: false })
    expect(
      getPriceStrategiesState({ showChartErrorView: false, poolOrPairLoading: false, chartLoading: true }),
    ).toEqual({ showPriceStrategies: true, priceStrategiesLoading: true })
  })
})

describe('getPriceLineSource', () => {
  const SETTLED_SOURCE = {
    creatingPoolOrPair: false,
    poolHasNoActiveLiquidity: false,
    poolId: 'own',
    siblingPoolId: 'sibling',
    siblingPoolLoading: false,
    hasOwnPositions: true,
    rawTicksLoading: false,
  }

  it('uses the pool itself when it has liquidity', () => {
    expect(getPriceLineSource(SETTLED_SOURCE)).toEqual({ priceHistoryPoolId: 'own', priceSourceLoading: false })
  })

  it('borrows the sibling for a pool holding nothing', () => {
    expect(getPriceLineSource({ ...SETTLED_SOURCE, poolHasNoActiveLiquidity: true, hasOwnPositions: false })).toEqual({
      priceHistoryPoolId: 'sibling',
      priceSourceLoading: false,
    })
  })

  it('keeps its own series when the pool holds positions outside the current tick', () => {
    // Zero *active* liquidity, but real positions further out — that pool has traded, so its own
    // history is the truthful line and the sibling's would only be a proxy for it. Keyed on the raw
    // ticks, not the density distribution: that distribution is undefined for a pool whose positions
    // all sit on one side of the active tick (no `computeSurroundingTicks` pivot) — the very shape
    // this branch exists for, so deriving it from the distribution made the branch unreachable there.
    expect(getPriceLineSource({ ...SETTLED_SOURCE, poolHasNoActiveLiquidity: true })).toEqual({
      priceHistoryPoolId: 'own',
      priceSourceLoading: false,
    })
  })

  it('falls back to its own id when the pair has no sibling', () => {
    expect(
      getPriceLineSource({
        ...SETTLED_SOURCE,
        poolHasNoActiveLiquidity: true,
        hasOwnPositions: false,
        siblingPoolId: undefined,
      }),
    ).toEqual({ priceHistoryPoolId: 'own', priceSourceLoading: false })
  })

  it('withholds the id while the choice could still change', () => {
    for (const pending of [{ siblingPoolLoading: true }, { rawTicksLoading: true }]) {
      expect(
        getPriceLineSource({
          ...SETTLED_SOURCE,
          poolHasNoActiveLiquidity: true,
          hasOwnPositions: false,
          ...pending,
        }),
      ).toEqual({ priceHistoryPoolId: undefined, priceSourceLoading: true })
    }
  })

  it("stops waiting once the pool's own distribution has pinned the answer", () => {
    // The sibling lookup can still be in flight — its answer is no longer reachable, so serializing
    // behind it would delay this pool's own history for nothing, and (mid-session, when a poll flips
    // active liquidity to zero) would blank a chart whose source never actually changed.
    expect(getPriceLineSource({ ...SETTLED_SOURCE, poolHasNoActiveLiquidity: true, siblingPoolLoading: true })).toEqual(
      { priceHistoryPoolId: 'own', priceSourceLoading: false },
    )
  })

  it('never gates a pool being created on tick fetches it skipped', () => {
    // Those fetches are skipped while creating, so their state must not reach this — a skipped query
    // happens to report `isLoading: false` today, but the guard shouldn't depend on that.
    expect(
      getPriceLineSource({
        ...SETTLED_SOURCE,
        creatingPoolOrPair: true,
        poolId: undefined,
        hasOwnPositions: false,
        rawTicksLoading: true,
      }),
    ).toEqual({ priceHistoryPoolId: 'sibling', priceSourceLoading: false })
  })
})

describe('getFallbackPriceInverted', () => {
  const WETH = WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet] as Token
  const ETH = nativeOnChain(UniverseChainId.Mainnet)
  const WLD = new Token(UniverseChainId.Mainnet, '0x163f8C2467924be0ae7B5347228CABF260318753', 18, 'WLD')

  it("keeps this chart's orientation when both pools sort the pair the same way", () => {
    // WLD/USDC: two ERC20s sort identically in v3 and v4.
    const sdkCurrencies = { TOKEN0: WLD, TOKEN1: USDC }
    const fallbackCurrencies = { currency0: WLD, currency1: USDC }
    expect(getFallbackPriceInverted({ fallbackCurrencies, sdkCurrencies, priceInverted: false })).toBe(false)
    expect(getFallbackPriceInverted({ fallbackCurrencies, sdkCurrencies, priceInverted: true })).toBe(true)
  })

  it('flips the orientation when native ETH sorts the pair the other way round', () => {
    // v3 sorts USDC (0xA0b8…) ahead of WETH (0xC02a…); v4 sorts native ETH (0x0) first.
    const sdkCurrencies = { TOKEN0: ETH, TOKEN1: USDC }
    const fallbackCurrencies = { currency0: USDC, currency1: WETH }
    expect(getFallbackPriceInverted({ fallbackCurrencies, sdkCurrencies, priceInverted: false })).toBe(true)
    expect(getFallbackPriceInverted({ fallbackCurrencies, sdkCurrencies, priceInverted: true })).toBe(false)
  })

  it('matches native ETH to WETH when both pools sort it to the same side', () => {
    const sdkCurrencies = { TOKEN0: ETH, TOKEN1: WLD }
    const fallbackCurrencies = { currency0: WETH, currency1: WLD }
    expect(getFallbackPriceInverted({ fallbackCurrencies, sdkCurrencies, priceInverted: false })).toBe(false)
  })

  it("is undefined when the fallback pool isn't the same pair on the same chain", () => {
    const usdcAddressOnBase = new Token(UniverseChainId.Base, USDC.address, 6, 'USDC')
    expect(
      getFallbackPriceInverted({
        fallbackCurrencies: { currency0: WLD, currency1: WETH },
        sdkCurrencies: { TOKEN0: WLD, TOKEN1: USDC },
        priceInverted: false,
      }),
    ).toBeUndefined()
    expect(
      getFallbackPriceInverted({
        fallbackCurrencies: { currency0: usdcAddressOnBase, currency1: WLD },
        sdkCurrencies: { TOKEN0: USDC, TOKEN1: WLD },
        priceInverted: false,
      }),
    ).toBeUndefined()
  })

  it("is undefined while either of this pool's tokens is unknown", () => {
    expect(
      getFallbackPriceInverted({
        fallbackCurrencies: { currency0: WLD, currency1: USDC },
        sdkCurrencies: { TOKEN0: WLD, TOKEN1: undefined },
        priceInverted: false,
      }),
    ).toBeUndefined()
  })
})

describe('usesFallbackPriceLine', () => {
  it("prefers the fallback's series over a sibling's", () => {
    expect(usesFallbackPriceLine({ borrowsSibling: true, hasPickedHistory: true, hasFallbackHistory: true })).toBe(true)
  })

  it("takes over when the pool's own series is empty", () => {
    expect(usesFallbackPriceLine({ borrowsSibling: false, hasPickedHistory: false, hasFallbackHistory: true })).toBe(
      true,
    )
  })

  it("keeps the pool's own history when it has one", () => {
    expect(usesFallbackPriceLine({ borrowsSibling: false, hasPickedHistory: true, hasFallbackHistory: true })).toBe(
      false,
    )
  })

  it('never swaps in an empty fallback series', () => {
    for (const borrowsSibling of [true, false]) {
      for (const hasPickedHistory of [true, false]) {
        expect(usesFallbackPriceLine({ borrowsSibling, hasPickedHistory, hasFallbackHistory: false })).toBe(false)
      }
    }
  })
})
