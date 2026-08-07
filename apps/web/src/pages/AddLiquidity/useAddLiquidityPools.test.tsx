import { useInfiniteQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import type { PoolSummary } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PoolSortFields } from '~/data/pools/useTopPools'
import { OrderDirection } from '~/data/util'
import { useAddLiquidityPools } from '~/pages/AddLiquidity/useAddLiquidityPools'

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useInfiniteQuery: vi.fn() }
})

vi.mock('uniswap/src/data/apiClients/liquidityService/liquidityQueries', () => ({
  liquidityQueries: {
    listPools: vi.fn(() => ({ queryKey: [ReactQueryCacheKey.LiquidityService, 'listPools'], queryFn: vi.fn() })),
  },
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: [UniverseChainId.Mainnet] }),
}))

const useInfiniteQueryMock = vi.mocked(useInfiniteQuery)
const listPoolsMock = vi.mocked(liquidityQueries.listPools)

const SORT_STATE = { sortBy: PoolSortFields.TVL, sortDirection: OrderDirection.Desc }

/** Build a PoolSummary-shaped object; only the fields read by the converter/filter matter. */
function buildPool(overrides: Partial<PoolSummary>): PoolSummary {
  return {
    poolIdentifier: 'pool-default',
    chainId: UniverseChainId.Mainnet,
    protocolVersion: Protocols.V3,
    token0Address: '0x1111111111111111111111111111111111111111',
    token1Address: '0x2222222222222222222222222222222222222222',
    feeTier: 3000,
    tvlUsd: 1000,
    volumeUsd1d: 50,
    apr: 0.1,
    token0Metadata: { symbol: 'AAA', name: 'Token A', decimals: 18, logoUrl: 'logoA' },
    token1Metadata: { symbol: 'BBB', name: 'Token B', decimals: 6, logoUrl: 'logoB' },
    ...overrides,
  } as unknown as PoolSummary
}

function mockPools(pools: PoolSummary[]): void {
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [{ pools, nextCursor: undefined }] },
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  } as unknown as ReturnType<typeof useInfiniteQuery>)
}

describe('useAddLiquidityPools', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns all converted pools when no filter string is set', () => {
    mockPools([buildPool({ poolIdentifier: 'pool-1' }), buildPool({ poolIdentifier: 'pool-2' })])
    const { result } = renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools).toHaveLength(2)
  })

  it('requests spam-filtered pools from the ListPools endpoint', () => {
    mockPools([buildPool({ poolIdentifier: 'pool-1' })])
    renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: '' }))
    expect(listPoolsMock).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ filterSpam: true }) }),
    )
  })

  // Regression: native-token pools come back with an empty token address (proto3 scalar defaults to ''),
  // which the converter stores as `undefined`. The search filter must not crash on the address lookup.
  it('does not throw when filtering a pool whose token address is empty (native token)', () => {
    const nativeEthPool = buildPool({
      poolIdentifier: 'pool-eth',
      token0Address: '', // native token → empty address from the backend
      token0Metadata: {
        symbol: 'ETH',
        name: 'Ether',
        decimals: 18,
        logoUrl: 'logoEth',
      } as PoolSummary['token0Metadata'],
    })
    mockPools([nativeEthPool])

    // A filter that matches nothing forces evaluation of every branch, including the empty-address lookup.
    const { result } = renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: 'zzz' }))
    expect(result.current.pools).toEqual([])

    // The same pool is still findable by a field that is present.
    const { result: bySymbol } = renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: 'eth' }))
    expect(bySymbol.current.pools).toHaveLength(1)
    expect(bySymbol.current.pools?.[0]?.id).toBe('pool-eth')
  })

  it('matches pools by token address substring (case-insensitive)', () => {
    mockPools([
      buildPool({ poolIdentifier: 'pool-1', token1Address: '0xAbCdEf0000000000000000000000000000001234' }),
      buildPool({ poolIdentifier: 'pool-2', token1Address: '0x9999999999999999999999999999999999999999' }),
    ])
    const { result } = renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: 'abcdef' }))
    expect(result.current.pools).toHaveLength(1)
    expect(result.current.pools?.[0]?.id).toBe('pool-1')
  })

  // Regression: missing token symbols must not be interpolated into the pool name as the literal "undefined".
  it('does not spuriously match the literal "undefined" when token symbols are missing', () => {
    mockPools([buildPool({ poolIdentifier: 'pool-x', token0Metadata: undefined, token1Metadata: undefined })])
    const { result } = renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: 'undefined' }))
    expect(result.current.pools).toEqual([])
  })

  it('converts the numeric protocol version to a display label', () => {
    mockPools([buildPool({ poolIdentifier: 'pool-1', protocolVersion: Protocols.V4 })])
    const { result } = renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.protocolVersion).toBe('v4')
  })

  // Regression: the ListPools query is persisted to storage and rehydrated as plain JSON, where the
  // protobuf `Protocols` enum is its name ("V4") rather than the numeric value. The converter must
  // still resolve a label, otherwise the pool table's Protocol column renders empty after a refresh.
  it('converts the persisted (enum-name) protocol version to a display label', () => {
    mockPools([buildPool({ poolIdentifier: 'pool-1', protocolVersion: 'V4' as unknown as Protocols })])
    const { result } = renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.protocolVersion).toBe('v4')
  })

  it('passes through a static fee tier as-is', () => {
    mockPools([buildPool({ poolIdentifier: 'pool-1', feeTier: 3000, tickSpacing: 60, isDynamicFee: false })])
    const { result } = renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.feeTier?.feeAmount).toBe(3000)
    expect(result.current.pools?.[0]?.feeTier?.tickSpacing).toBe(60)
    expect(result.current.pools?.[0]?.feeTier?.isDynamic).toBe(false)
  })

  // Robinhood-chain dynamic-fee pools serve the protocol's raw max-fee constant (1_000_000) as
  // `feeTier`, not the SDK's dynamic-fee sentinel — literally 8388608 here, not just the named
  // constant, so a revert of the normalization is caught even if the constant's value ever moves.
  // Un-normalized, this both trips the v4-sdk's "Invariant failed" fee check downstream and
  // renders as a false "100%" fee badge on the add-liquidity pool table row.
  it('normalizes a dynamic-fee pool feeAmount to the SDK sentinel', () => {
    mockPools([buildPool({ poolIdentifier: 'pool-dynamic', feeTier: 1_000_000, isDynamicFee: true, tickSpacing: 200 })])
    const { result } = renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.feeTier?.feeAmount).toBe(8_388_608)
    expect(result.current.pools?.[0]?.feeTier?.feeAmount).toBe(DYNAMIC_FEE_AMOUNT)
    expect(result.current.pools?.[0]?.feeTier?.tickSpacing).toBe(200)
    expect(result.current.pools?.[0]?.feeTier?.isDynamic).toBe(true)
  })

  it('falls back to the default tick spacing when none is served', () => {
    mockPools([buildPool({ poolIdentifier: 'pool-1', tickSpacing: 0 })])
    const { result } = renderHook(() => useAddLiquidityPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.feeTier?.tickSpacing).toBe(DEFAULT_TICK_SPACING)
  })
})
