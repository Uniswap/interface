import type { PlainMessage } from '@bufbuild/protobuf'
import { renderHook } from '@testing-library/react'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { RankedPool } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { Currency, CurrencyAmount, Fraction, Token } from '@uniswap/sdk-core'
import { encodeSqrtRatioX96, FeeAmount, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { UniverseChainId } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  getEffectivePositionStatus,
  getEffectivePositionStatusInfo,
  isPoolPriceOutOfSync,
  useEffectivePositionStatus,
} from 'uniswap/src/features/positions/hooks/useEffectivePositionStatus'
import { getMarketPriceImpliedTick } from 'uniswap/src/features/positions/poolPriceDivergence'
import { MIN_TRUSTED_SIBLING_TVL_USD } from 'uniswap/src/features/positions/siblingPoolPrice'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUseUSDCValueWithStatus, mockUseInfiniteQuery } = vi.hoisted(() => ({
  mockUseUSDCValueWithStatus: vi.fn(),
  mockUseInfiniteQuery: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValueWithStatus: (
    amount: CurrencyAmount<Currency> | undefined,
  ): { value: CurrencyAmount<Currency> | null; isLoading: boolean } => mockUseUSDCValueWithStatus(amount),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useInfiniteQuery: mockUseInfiniteQuery,
}))

// Pass the query options through so each sibling-pair `enabled` flag can be asserted directly.
vi.mock('uniswap/src/data/apiClients/dataApiService/pools/queries', () => ({
  getListPoolsInfiniteQueryOptions: (input: unknown): unknown => input,
}))

// Pool at 1 DAI = 1 WETH (tick 0); both tokens have 18 decimals
const SQRT_RATIO_1_1 = encodeSqrtRatioX96(1, 1)
// Pool pinned at 1 DAI = 4 WETH (tick ≈ 13863), far from the range below
const SQRT_RATIO_4_1 = encodeSqrtRatioX96(4, 1)
const TICK_4_1 = TickMath.getTickAtSqrtRatio(SQRT_RATIO_4_1)

function buildV3Pool(liquidity: string, sqrtRatio = SQRT_RATIO_1_1, tick = 0): V3Pool {
  return new V3Pool(DAI, WETH, FeeAmount.MEDIUM, sqrtRatio, liquidity, tick)
}

function buildV4Pool(liquidity: string, sqrtRatio = SQRT_RATIO_1_1, tick = 0): V4Pool {
  return new V4Pool(
    DAI,
    WETH,
    FeeAmount.MEDIUM,
    TICK_SPACINGS[FeeAmount.MEDIUM],
    ZERO_ADDRESS,
    sqrtRatio,
    liquidity,
    tick,
  )
}

const IN_RANGE_TICKS = { tickLower: -1000, tickUpper: 1000 }

// Extreme-decimals token pinned at MAX tick: quoting 1 unit of it overflows the SDK's amount bounds
const EXT = new Token(UniverseChainId.Mainnet, '0x0000000000000000000000000000000000000002', 24, 'EXT', 'Extreme')
const MAX_TICK_RATIO = TickMath.getSqrtRatioAtTick(TickMath.MAX_TICK - 1)

function buildDegenerateV3Pool(liquidity: string): V3Pool {
  return new V3Pool(EXT, WETH, FeeAmount.MEDIUM, MAX_TICK_RATIO, liquidity, TickMath.MAX_TICK - 1)
}

describe('getMarketPriceImpliedTick', () => {
  it('returns the tick implied by the market price', () => {
    // log(2) / log(1.0001) ≈ 6931
    expect(getMarketPriceImpliedTick({ pool: buildV3Pool('1'), marketPrice: new Fraction(2) })).toBe(6931)
    expect(getMarketPriceImpliedTick({ pool: buildV4Pool('1'), marketPrice: new Fraction(2) })).toBe(6931)
    expect(getMarketPriceImpliedTick({ pool: buildV3Pool('1'), marketPrice: new Fraction(1) })).toBe(0)
  })

  it('does not invert the implied tick for a v4 pool with native currency0 (the motivating ETH/GUY shape)', () => {
    const nativeV4Pool = new V4Pool(
      nativeOnChain(UniverseChainId.Mainnet),
      DAI,
      FeeAmount.MEDIUM,
      TICK_SPACINGS[FeeAmount.MEDIUM],
      ZERO_ADDRESS,
      SQRT_RATIO_1_1,
      '1',
      0,
    )
    // Native sorts first in v4 pools
    expect(nativeV4Pool.currency0.isNative).toBe(true)
    // marketPrice is currency1-per-currency0: 2 DAI per ETH implies tick ≈ +6931, not -6931
    expect(getMarketPriceImpliedTick({ pool: nativeV4Pool, marketPrice: new Fraction(2) })).toBe(6931)
    expect(getMarketPriceImpliedTick({ pool: nativeV4Pool, marketPrice: new Fraction(1) })).toBe(0)
  })
})

describe('isPoolPriceOutOfSync', () => {
  it('returns false when the pool is missing, or when a healthy pool has no market price to compare against', () => {
    expect(isPoolPriceOutOfSync({ pool: undefined, marketPrice: new Fraction(1) })).toBe(false)
    expect(isPoolPriceOutOfSync({ pool: buildV3Pool('1'), marketPrice: undefined })).toBe(false)
  })

  it('returns true for a pool with zero in-range liquidity even without a market price', () => {
    expect(isPoolPriceOutOfSync({ pool: buildV3Pool('0'), marketPrice: undefined })).toBe(true)
  })

  it('returns false when the pool tracks the market price', () => {
    expect(isPoolPriceOutOfSync({ pool: buildV3Pool('1'), marketPrice: new Fraction(1) })).toBe(false)
  })

  it('returns true when the pool price diverges beyond the threshold', () => {
    expect(isPoolPriceOutOfSync({ pool: buildV3Pool('1'), marketPrice: new Fraction(2) })).toBe(true)
  })

  it('clears the zero-liquidity signal when the reference agrees with the drained pool price', () => {
    // Drained but correctly priced: the reference confirms the pool's own price, so don't warn
    expect(isPoolPriceOutOfSync({ pool: buildV3Pool('0'), marketPrice: new Fraction(1) })).toBe(false)
  })

  it('returns true for a drained pool whose price diverges from the reference', () => {
    expect(isPoolPriceOutOfSync({ pool: buildV3Pool('0'), marketPrice: new Fraction(2) })).toBe(true)
  })

  it('returns true when the pool price is too extreme to compare against the reference', () => {
    // The divergence check overflows the SDK's bounds: the pool price must read as untrusted, not in sync
    expect(isPoolPriceOutOfSync({ pool: buildDegenerateV3Pool('1'), marketPrice: new Fraction(1) })).toBe(true)
    expect(isPoolPriceOutOfSync({ pool: buildDegenerateV3Pool('0'), marketPrice: new Fraction(1) })).toBe(true)
  })
})

describe('getEffectivePositionStatus', () => {
  it('passes through statuses the check cannot apply to', () => {
    expect(
      getEffectivePositionStatus({
        status: PositionStatus.CLOSED,
        pool: buildV3Pool('1'),
        ...IN_RANGE_TICKS,
        marketPrice: new Fraction(2),
        isPoolOutOfSync: true,
      }),
    ).toBe(PositionStatus.CLOSED)
  })

  it('passes through when pool, ticks, or market price are missing', () => {
    const base = {
      status: PositionStatus.IN_RANGE,
      pool: buildV3Pool('1'),
      ...IN_RANGE_TICKS,
      isPoolOutOfSync: true,
    }
    expect(getEffectivePositionStatus({ ...base, pool: undefined, marketPrice: new Fraction(2) })).toBe(
      PositionStatus.IN_RANGE,
    )
    expect(getEffectivePositionStatus({ ...base, tickLower: undefined, marketPrice: new Fraction(2) })).toBe(
      PositionStatus.IN_RANGE,
    )
    expect(getEffectivePositionStatus({ ...base, marketPrice: undefined })).toBe(PositionStatus.IN_RANGE)
  })

  it('never overrides when the pool is in sync', () => {
    expect(
      getEffectivePositionStatus({
        status: PositionStatus.IN_RANGE,
        pool: buildV3Pool('1'),
        ...IN_RANGE_TICKS,
        marketPrice: new Fraction(1),
        isPoolOutOfSync: false,
      }),
    ).toBe(PositionStatus.IN_RANGE)
    // Served out of range and the pool is healthy: stays out of range even though ticks disagree
    expect(
      getEffectivePositionStatus({
        status: PositionStatus.OUT_OF_RANGE,
        pool: buildV3Pool('1'),
        ...IN_RANGE_TICKS,
        marketPrice: new Fraction(1),
        isPoolOutOfSync: false,
      }),
    ).toBe(PositionStatus.OUT_OF_RANGE)
  })

  it('flips in range → out of range when the pool is out of sync and the market-implied tick is outside', () => {
    expect(
      getEffectivePositionStatus({
        status: PositionStatus.IN_RANGE,
        pool: buildV3Pool('1'),
        ...IN_RANGE_TICKS,
        marketPrice: new Fraction(2),
        isPoolOutOfSync: true,
      }),
    ).toBe(PositionStatus.OUT_OF_RANGE)
    expect(
      getEffectivePositionStatus({
        status: PositionStatus.IN_RANGE,
        pool: buildV4Pool('1'),
        ...IN_RANGE_TICKS,
        marketPrice: new Fraction(2),
        isPoolOutOfSync: true,
      }),
    ).toBe(PositionStatus.OUT_OF_RANGE)
  })

  it('flips out of range → in range when the pool is out of sync and the market-implied tick is inside', () => {
    // Pool pinned at 4 WETH/DAI, market at 1 WETH/DAI, which sits inside the range
    expect(
      getEffectivePositionStatus({
        status: PositionStatus.OUT_OF_RANGE,
        pool: buildV3Pool('1', SQRT_RATIO_4_1, TICK_4_1),
        ...IN_RANGE_TICKS,
        marketPrice: new Fraction(1),
        isPoolOutOfSync: true,
      }),
    ).toBe(PositionStatus.IN_RANGE)
    expect(
      getEffectivePositionStatus({
        status: PositionStatus.OUT_OF_RANGE,
        pool: buildV4Pool('1', SQRT_RATIO_4_1, TICK_4_1),
        ...IN_RANGE_TICKS,
        marketPrice: new Fraction(1),
        isPoolOutOfSync: true,
      }),
    ).toBe(PositionStatus.IN_RANGE)
  })

  it('keeps in range when the position would still be in range at the market price', () => {
    expect(
      getEffectivePositionStatus({
        status: PositionStatus.IN_RANGE,
        pool: buildV3Pool('1'),
        tickLower: -10000,
        tickUpper: 10000,
        marketPrice: new Fraction(2),
        isPoolOutOfSync: true,
      }),
    ).toBe(PositionStatus.IN_RANGE)
  })

  it('keeps out of range when the market-implied tick is also outside the range', () => {
    expect(
      getEffectivePositionStatus({
        status: PositionStatus.OUT_OF_RANGE,
        pool: buildV3Pool('1', SQRT_RATIO_4_1, TICK_4_1),
        tickLower: 20000,
        tickUpper: 30000,
        marketPrice: new Fraction(1),
        isPoolOutOfSync: true,
      }),
    ).toBe(PositionStatus.OUT_OF_RANGE)
  })
})

describe('getEffectivePositionStatusInfo', () => {
  const baseArgs = {
    status: PositionStatus.IN_RANGE,
    pool: buildV3Pool('1'),
    ...IN_RANGE_TICKS,
    // The trust gate is required and never open by omission; tests exercise the trusted path unless overridden
    isSiblingPriceTrusted: true,
  }

  it('trusts the sibling pool over a diverging USD feed', () => {
    // The feed says the pool is 100% off, but the most liquid sibling pool agrees with it
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      feedMarketPrice: new Fraction(2),
      siblingPoolPrice: new Fraction(1),
    })
    expect(result).toEqual({
      effectiveStatus: PositionStatus.IN_RANGE,
      isPoolPriceStale: false,
      isPoolOutOfSync: false,
      marketPrice: undefined,
    })
  })

  it('substitutes the sibling pool price when the pool diverges from it', () => {
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      feedMarketPrice: new Fraction(1),
      siblingPoolPrice: new Fraction(2),
    })
    expect(result.isPoolOutOfSync).toBe(true)
    // Market-implied tick (~6931) is above the range
    expect(result.effectiveStatus).toBe(PositionStatus.OUT_OF_RANGE)
    expect(result.isPoolPriceStale).toBe(true)
    expect(result.marketPrice?.toSignificant(6)).toBe('2')
  })

  it('flips out of range -> in range off the sibling pool price', () => {
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      status: PositionStatus.OUT_OF_RANGE,
      pool: buildV3Pool('1', SQRT_RATIO_4_1, TICK_4_1),
      siblingPoolPrice: new Fraction(1),
    })
    expect(result.effectiveStatus).toBe(PositionStatus.IN_RANGE)
    expect(result.isPoolPriceStale).toBe(true)
    expect(result.marketPrice?.toSignificant(6)).toBe('1')
  })

  it('raises the warning icon only when the USD feed diverges and no sibling pool exists', () => {
    // The feed can be badly wrong for long-tail tokens: alone it may raise the icon, never flip the badge
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      feedMarketPrice: new Fraction(2),
      siblingPoolPrice: undefined,
    })
    expect(result).toEqual({
      effectiveStatus: PositionStatus.IN_RANGE,
      isPoolPriceStale: false,
      isPoolOutOfSync: true,
      // Never substitute a feed-derived price for display
      marketPrice: undefined,
    })
  })

  it('raises the warning icon only off an untrusted liquidity-only sibling reference', () => {
    // A sibling that won only on raw in-range liquidity (zero USD TVL) is cheap to capture with a
    // narrow-range mint: like the feed, it may raise the icon but never becomes the displayed
    // price or flips the badge
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      siblingPoolPrice: new Fraction(2),
      isSiblingPriceTrusted: false,
    })
    expect(result.isPoolOutOfSync).toBe(true)
    expect(result.effectiveStatus).toBe(PositionStatus.IN_RANGE)
    expect(result.isPoolPriceStale).toBe(false)
    expect(result.marketPrice).toBeUndefined()
  })

  it('keeps the feed-divergence warning when an untrusted sibling agrees with the pool', () => {
    // An untrusted sibling may only raise the verdict: its agreement must not silence the feed signal
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      feedMarketPrice: new Fraction(2),
      siblingPoolPrice: new Fraction(1),
      isSiblingPriceTrusted: false,
    })
    expect(result.isPoolOutOfSync).toBe(true)
    expect(result.effectiveStatus).toBe(PositionStatus.IN_RANGE)
    expect(result.isPoolPriceStale).toBe(false)
    expect(result.marketPrice).toBeUndefined()
  })

  it('keeps the zero-liquidity warning when an untrusted sibling agrees with the drained pool', () => {
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      pool: buildV3Pool('0'),
      siblingPoolPrice: new Fraction(1),
      isSiblingPriceTrusted: false,
    })
    expect(result.isPoolOutOfSync).toBe(true)
    expect(result.effectiveStatus).toBe(PositionStatus.IN_RANGE)
    expect(result.isPoolPriceStale).toBe(false)
    expect(result.marketPrice).toBeUndefined()
  })

  it('stays quiet while the sibling pool price is still loading', () => {
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      feedMarketPrice: new Fraction(2),
      isSiblingPricePending: true,
    })
    expect(result).toEqual({
      effectiveStatus: PositionStatus.IN_RANGE,
      isPoolPriceStale: false,
      isPoolOutOfSync: false,
      marketPrice: undefined,
    })
  })

  it('warns without substitution or status flip for a drained pool with no reference price at all', () => {
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      pool: buildV3Pool('0'),
    })
    expect(result).toEqual({
      effectiveStatus: PositionStatus.IN_RANGE,
      isPoolPriceStale: false,
      isPoolOutOfSync: true,
      marketPrice: undefined,
    })
  })

  it('stays quiet for a drained pool whose price the sibling pool confirms', () => {
    // Drained but correctly priced: never warn on or substitute a price the reference agrees with
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      pool: buildV3Pool('0'),
      siblingPoolPrice: new Fraction(1),
    })
    expect(result).toEqual({
      effectiveStatus: PositionStatus.IN_RANGE,
      isPoolPriceStale: false,
      isPoolOutOfSync: false,
      marketPrice: undefined,
    })
  })

  it('keeps the zero-liquidity warning when only the USD feed vouches for a drained pool', () => {
    // Only a trusted sibling may clear the zero-liquidity signal: an agreeing feed cannot vouch
    // for a pinned price, so the drained pool warns (icon only — no flip, no substitution)
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      pool: buildV3Pool('0'),
      feedMarketPrice: new Fraction(1),
    })
    expect(result).toEqual({
      effectiveStatus: PositionStatus.IN_RANGE,
      isPoolPriceStale: false,
      isPoolOutOfSync: true,
      marketPrice: undefined,
    })
  })

  it('warns and substitutes for a drained pool whose price diverges from the sibling pool', () => {
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      pool: buildV3Pool('0'),
      siblingPoolPrice: new Fraction(2),
    })
    expect(result.isPoolOutOfSync).toBe(true)
    // Market-implied tick (~6931) is above the range
    expect(result.effectiveStatus).toBe(PositionStatus.OUT_OF_RANGE)
    expect(result.isPoolPriceStale).toBe(true)
    expect(result.marketPrice?.toSignificant(6)).toBe('2')
  })

  it('warns and substitutes when the pool price is too extreme to compare against the sibling pool', () => {
    // The divergence check overflows the SDK's bounds: the pool price is untrusted, so warn and
    // substitute the sibling reference instead of rendering the degenerate pool price as trustworthy
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      pool: buildDegenerateV3Pool('1'),
      siblingPoolPrice: new Fraction(1),
    })
    expect(result.isPoolOutOfSync).toBe(true)
    // Market-implied tick for a decimal-adjusted price of 1 between 24- and 18-decimals tokens is far below the range
    expect(result.effectiveStatus).toBe(PositionStatus.OUT_OF_RANGE)
    expect(result.isPoolPriceStale).toBe(true)
    expect(result.marketPrice?.toSignificant(6)).toBe('1')
  })

  it('raises the warning icon only when the pool price is too extreme and only the USD feed exists', () => {
    const result = getEffectivePositionStatusInfo({
      ...baseArgs,
      pool: buildDegenerateV3Pool('1'),
      feedMarketPrice: new Fraction(1),
    })
    expect(result.isPoolOutOfSync).toBe(true)
    // No sibling reference: never override the served status or substitute off the feed
    expect(result.effectiveStatus).toBe(PositionStatus.IN_RANGE)
    expect(result.isPoolPriceStale).toBe(false)
    expect(result.marketPrice).toBeUndefined()
  })
})

const USD_STAND_IN = new Token(UniverseChainId.Mainnet, '0x00000000000000000000000000000000000000A1', 6, 'USD')

function buildRankedPool(
  overrides: {
    poolId?: string
    token0?: string
    token1?: string
    sqrtPriceX96?: string
    liquidity?: string
    tvl?: number
  } = {},
): PlainMessage<RankedPool> {
  return {
    pool: {
      poolId: overrides.poolId ?? '0x0000000000000000000000000000000000000001',
      token0: { address: overrides.token0 ?? DAI.address },
      token1: { address: overrides.token1 ?? WETH.address },
      sqrtPriceX96: overrides.sqrtPriceX96 ?? SQRT_RATIO_1_1.toString(),
      liquidity: overrides.liquidity ?? '1000',
    },
    // At the trusted-TVL floor: siblings built here are trusted unless a test overrides the TVL
    stats: { tvl: overrides.tvl ?? MIN_TRUSTED_SIBLING_TVL_USD },
  } as unknown as PlainMessage<RankedPool>
}

// Minimal react-query result states the hook consumes. Idle (enabled but not yet dispatched) and
// in-flight are indistinguishable to the hook: neither has settled.
const QUERY_PENDING = { data: undefined, isSuccess: false, isError: false }
const QUERY_ERROR = { data: undefined, isSuccess: false, isError: true }

function querySuccess(pools: PlainMessage<RankedPool>[]): {
  data: { pages: { pools: PlainMessage<RankedPool>[] }[] }
  isSuccess: boolean
  isError: boolean
} {
  return { data: { pages: [{ pools }] }, isSuccess: true, isError: false }
}

function buildPositionInfo(pool: V3Pool): PositionInfo {
  return {
    version: ProtocolVersion.V3,
    status: PositionStatus.IN_RANGE,
    poolOrPair: pool,
    chainId: UniverseChainId.Mainnet,
    poolId: '0x000000000000000000000000000000000000dead',
    tokenId: '1',
    ...IN_RANGE_TICKS,
    currency0Amount: CurrencyAmount.fromRawAmount(DAI, 0),
    currency1Amount: CurrencyAmount.fromRawAmount(WETH, 0),
    feeTier: undefined,
    v4hook: undefined,
    owner: ZERO_ADDRESS,
  }
}

describe('useEffectivePositionStatus', () => {
  beforeEach(() => {
    mockUseUSDCValueWithStatus.mockReset()
    mockUseInfiniteQuery.mockReset()
    mockUseInfiniteQuery.mockReturnValue(QUERY_PENDING)
  })

  /** USD feed settled: tokens absent from the record have no USD price (value null, not loading). */
  function mockUsdUnitValues(valuesBySymbol: Record<string, number>): void {
    mockUseUSDCValueWithStatus.mockImplementation((amount?: CurrencyAmount<Currency>) => {
      const usd = amount?.currency.symbol !== undefined ? valuesBySymbol[amount.currency.symbol] : undefined
      return {
        value: usd === undefined ? null : CurrencyAmount.fromRawAmount(USD_STAND_IN, usd * 10 ** USD_STAND_IN.decimals),
        isLoading: false,
      }
    })
  }

  function mockUsdFeedLoading(): void {
    mockUseUSDCValueWithStatus.mockReturnValue({ value: null, isLoading: true })
  }

  it('does not query sibling pools while the USD feed agrees with the pool price', () => {
    mockUsdUnitValues({ DAI: 1, WETH: 1 })
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(result.current.isPoolOutOfSync).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
    expect(mockUseInfiniteQuery).toHaveBeenCalled()
    for (const call of mockUseInfiniteQuery.mock.calls) {
      expect(call[0].enabled).toBe(false)
    }
  })

  it('queries sibling pools on feed divergence and clears the warning when the best sibling agrees with the pool', () => {
    mockUsdUnitValues({ DAI: 2, WETH: 1 })
    mockUseInfiniteQuery.mockReturnValue(querySuccess([buildRankedPool()]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(mockUseInfiniteQuery.mock.calls.some((call) => call[0].enabled === true)).toBe(true)
    expect(result.current.isPoolOutOfSync).toBe(false)
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('substitutes the most liquid sibling pool price when the pool diverges from it', () => {
    mockUsdUnitValues({ DAI: 2, WETH: 1 })
    mockUseInfiniteQuery.mockReturnValue(querySuccess([buildRankedPool({ sqrtPriceX96: SQRT_RATIO_4_1.toString() })]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(result.current.isPoolOutOfSync).toBe(true)
    expect(result.current.effectiveStatus).toBe(PositionStatus.OUT_OF_RANGE)
    expect(result.current.isPoolPriceStale).toBe(true)
    expect(result.current.marketPrice?.toSignificant(6)).toBe('4')
  })

  it('raises the warning icon off the feed, without flipping the badge, when the sibling pool fetch returns nothing', () => {
    mockUsdUnitValues({ DAI: 2, WETH: 1 })
    mockUseInfiniteQuery.mockReturnValue(querySuccess([]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(result.current.isPoolOutOfSync).toBe(true)
    // The feed alone never overrides the served status
    expect(result.current.effectiveStatus).toBe(PositionStatus.IN_RANGE)
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('stays quiet until the sibling pool queries settle — the idle render right after enabling included', () => {
    mockUsdUnitValues({ DAI: 2, WETH: 1 })
    // QUERY_PENDING is also the state on the render where `enabled` flips false→true (fetchStatus
    // still 'idle', isLoading false): the guard must hold there too, not just while in flight
    mockUseInfiniteQuery.mockReturnValue(QUERY_PENDING)
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(result.current.isPoolOutOfSync).toBe(false)
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('falls back to the feed warning icon when the sibling pool fetch fails', () => {
    mockUsdUnitValues({ DAI: 2, WETH: 1 })
    // A failed fetch settles via isError: the guard must not hang the detection forever
    mockUseInfiniteQuery.mockReturnValue(QUERY_ERROR)
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(result.current.isPoolOutOfSync).toBe(true)
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('excludes the position own pool when picking a sibling', () => {
    mockUsdUnitValues({ DAI: 2, WETH: 1 })
    mockUseInfiniteQuery.mockReturnValue(
      querySuccess([
        buildRankedPool({
          poolId: '0x000000000000000000000000000000000000dead',
          sqrtPriceX96: SQRT_RATIO_1_1.toString(),
          tvl: 1000000,
        }),
      ]),
    )
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    // Only candidate is the position's own pool: fall back to the feed, warn, and don't substitute
    expect(result.current.isPoolOutOfSync).toBe(true)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('queries sibling pools for a drained pool even when the USD feed agrees, staying quiet once a trusted sibling confirms', () => {
    mockUsdUnitValues({ DAI: 1, WETH: 1 })
    mockUseInfiniteQuery.mockReturnValue(querySuccess([buildRankedPool()]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('0'))))

    // An agreeing feed must not skip the fetch: only a trusted sibling can vouch for a pinned price
    expect(mockUseInfiniteQuery.mock.calls.some((call) => call[0].enabled === true)).toBe(true)
    expect(result.current.isPoolOutOfSync).toBe(false)
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('warns for a drained pool when the USD feed agrees but no sibling pool exists', () => {
    mockUsdUnitValues({ DAI: 1, WETH: 1 })
    mockUseInfiniteQuery.mockReturnValue(querySuccess([]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('0'))))

    expect(result.current.isPoolOutOfSync).toBe(true)
    // No trusted reference to re-derive the status from: keep the served status, warn only
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('queries sibling pools for a drained pool with no feed and clears the warning when the sibling agrees', () => {
    mockUsdUnitValues({})
    mockUseInfiniteQuery.mockReturnValue(querySuccess([buildRankedPool()]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('0'))))

    expect(mockUseInfiniteQuery.mock.calls.some((call) => call[0].enabled === true)).toBe(true)
    expect(result.current.isPoolOutOfSync).toBe(false)
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('warns without substituting for a drained pool with no feed and no sibling pool', () => {
    mockUsdUnitValues({})
    mockUseInfiniteQuery.mockReturnValue(querySuccess([]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('0'))))

    expect(result.current.isPoolOutOfSync).toBe(true)
    // No reference price to re-derive the status from: keep the served status, warn only
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('warns and substitutes for a drained pool whose price diverges from the sibling pool', () => {
    mockUsdUnitValues({})
    mockUseInfiniteQuery.mockReturnValue(querySuccess([buildRankedPool({ sqrtPriceX96: SQRT_RATIO_4_1.toString() })]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('0'))))

    expect(result.current.isPoolOutOfSync).toBe(true)
    expect(result.current.effectiveStatus).toBe(PositionStatus.OUT_OF_RANGE)
    expect(result.current.isPoolPriceStale).toBe(true)
    expect(result.current.marketPrice?.toSignificant(6)).toBe('4')
  })

  it('queries sibling pools for an unpriced pair with a healthy pool and warns + substitutes on divergence', () => {
    // Neither token has a USD price (feed settled without one): the first-pass check can never
    // run, so the sibling reference is the only possible coverage for this pair
    mockUsdUnitValues({})
    mockUseInfiniteQuery.mockReturnValue(querySuccess([buildRankedPool({ sqrtPriceX96: SQRT_RATIO_4_1.toString() })]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(mockUseInfiniteQuery.mock.calls.some((call) => call[0].enabled === true)).toBe(true)
    expect(result.current.isPoolOutOfSync).toBe(true)
    expect(result.current.effectiveStatus).toBe(PositionStatus.OUT_OF_RANGE)
    expect(result.current.isPoolPriceStale).toBe(true)
    expect(result.current.marketPrice?.toSignificant(6)).toBe('4')
  })

  it('treats a below-floor-TVL sibling as untrusted: warning icon only, no substitution or flip', () => {
    mockUsdUnitValues({ DAI: 2, WETH: 1 })
    mockUseInfiniteQuery.mockReturnValue(
      querySuccess([
        buildRankedPool({
          sqrtPriceX96: SQRT_RATIO_4_1.toString(),
          tvl: MIN_TRUSTED_SIBLING_TVL_USD - 1,
        }),
      ]),
    )
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(result.current.isPoolOutOfSync).toBe(true)
    expect(result.current.effectiveStatus).toBe(PositionStatus.IN_RANGE)
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('raises the warning icon only when an unpriced pair diverges from a liquidity-only sibling', () => {
    // All candidates report zero USD TVL: the reference is detection-only, never displayed
    mockUsdUnitValues({})
    mockUseInfiniteQuery.mockReturnValue(
      querySuccess([buildRankedPool({ sqrtPriceX96: SQRT_RATIO_4_1.toString(), tvl: 0 })]),
    )
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(result.current.isPoolOutOfSync).toBe(true)
    expect(result.current.effectiveStatus).toBe(PositionStatus.IN_RANGE)
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('stays quiet for an unpriced pair when the sibling pool confirms the healthy pool price', () => {
    mockUsdUnitValues({})
    mockUseInfiniteQuery.mockReturnValue(querySuccess([buildRankedPool()]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(result.current.isPoolOutOfSync).toBe(false)
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('stays quiet for an unpriced pair with a healthy pool and no sibling pool', () => {
    mockUsdUnitValues({})
    mockUseInfiniteQuery.mockReturnValue(querySuccess([]))
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    // No reference at all: a pool with in-range liquidity keeps the benefit of the doubt
    expect(result.current.isPoolOutOfSync).toBe(false)
    expect(result.current.isPoolPriceStale).toBe(false)
    expect(result.current.marketPrice).toBeUndefined()
  })

  it('does not query sibling pools while the USD feed is still loading', () => {
    // A loading feed is not an absent feed: stay lazy so healthy priced pairs never fire the queries
    mockUsdFeedLoading()
    const { result } = renderHook(() => useEffectivePositionStatus(buildPositionInfo(buildV3Pool('1'))))

    expect(result.current.isPoolOutOfSync).toBe(false)
    expect(result.current.isPoolPriceStale).toBe(false)
    for (const call of mockUseInfiniteQuery.mock.calls) {
      expect(call[0].enabled).toBe(false)
    }
  })
})
