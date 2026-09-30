import type { PlainMessage } from '@bufbuild/protobuf'
import { useInfiniteQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolsOrderBy, PoolTokenLogicalOperator, type RankedPool } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { getListPoolsInfiniteQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PoolSortFields } from '~/data/pools/poolStats'
import { OrderDirection } from '~/data/util'
import { useV2ListPools } from '~/pages/Explore/hooks/useV2ListPools'

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useInfiniteQuery: vi.fn() }
})

vi.mock('uniswap/src/data/apiClients/dataApiService/pools/queries', () => ({
  getListPoolsInfiniteQueryOptions: vi.fn(() => ({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listPools'],
    queryFn: vi.fn(),
  })),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: [UniverseChainId.Mainnet] }),
}))

const useInfiniteQueryMock = vi.mocked(useInfiniteQuery)
const listPoolsMock = vi.mocked(getListPoolsInfiniteQueryOptions)

const SORT_STATE = { sortBy: PoolSortFields.TVL, sortDirection: OrderDirection.Desc }

const ALL_PROTOCOL_VERSIONS = [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]

/**
 * The filter every ranked pools request carries, whichever surface sent it. Tests spread in only the
 * part they exercise, so a change to the shared shape lands here once instead of in each assertion.
 */
function expectedFilter(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    protocolVersions: ALL_PROTOCOL_VERSIONS,
    includeSpam: false,
    applyTopLevelFilters: true,
    ...overrides,
  }
}

type PoolOverrides = Partial<PlainMessage<RankedPool>['pool']>
type StatsOverrides = Partial<PlainMessage<RankedPool>['stats']>

/** Build a RankedPool-shaped object; only the fields read by the normalizer/converter matter. */
function buildPool(pool?: PoolOverrides, stats?: StatsOverrides): PlainMessage<RankedPool> {
  return {
    pool: {
      poolId: 'pool-default',
      chainId: UniverseChainId.Mainnet,
      protocolVersion: ProtocolVersion.V3,
      feeTier: 3000,
      isDynamicFee: false,
      tickSpacing: 60,
      token0: {
        address: '0x1111111111111111111111111111111111111111',
        symbol: 'AAA',
        name: 'Token A',
        decimals: 18,
        project: { logoUrl: 'logoA' },
      },
      token1: {
        address: '0x2222222222222222222222222222222222222222',
        symbol: 'BBB',
        name: 'Token B',
        decimals: 6,
        project: { logoUrl: 'logoB' },
      },
      ...pool,
    },
    stats: { tvl: 1000, volume1d: 50, apr: 0.1, ...stats },
  } as unknown as PlainMessage<RankedPool>
}

function mockPools(pools: PlainMessage<RankedPool>[], { hasNextPage = false }: { hasNextPage?: boolean } = {}): void {
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [{ pools, page: undefined }] },
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage,
    isFetchingNextPage: false,
  } as unknown as ReturnType<typeof useInfiniteQuery>)
}

describe('useV2ListPools', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns all converted pools when no filter string is set', () => {
    mockPools([buildPool({ poolId: 'pool-1' }), buildPool({ poolId: 'pool-2' })])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools).toHaveLength(2)
  })

  it('requests spam-filtered, quality-gated pools from the ListPools endpoint', () => {
    mockPools([buildPool({ poolId: 'pool-1' })])
    renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(listPoolsMock).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ filter: expectedFilter() }) }),
    )
  })

  it('sorts by the endpoint order-by matching the table sort state', () => {
    mockPools([buildPool()])
    renderHook(() =>
      useV2ListPools({
        sortState: { sortBy: PoolSortFields.Volume24h, sortDirection: OrderDirection.Asc },
        filterString: '',
      }),
    )
    expect(listPoolsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ sort: { orderBy: PoolsOrderBy.VOLUME_1D, ascending: true } }),
      }),
    )
  })

  // POOLS_ORDER_BY_APR ranks on total_apr (fee apr + reward apr), so it covers reward sorting —
  // the shared map routes RewardApr there rather than degrading to the TVL default.
  it('sorts reward APR by the endpoint total-APR order-by', () => {
    mockPools([buildPool()])
    renderHook(() =>
      useV2ListPools({
        sortState: { sortBy: PoolSortFields.RewardApr, sortDirection: OrderDirection.Desc },
        filterString: '',
      }),
    )
    expect(listPoolsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ sort: { orderBy: PoolsOrderBy.APR, ascending: false } }),
      }),
    )
  })

  it('sends the trimmed search string as the ListPools searchQuery filter', () => {
    mockPools([buildPool()])
    renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: ' eth ' }))
    expect(listPoolsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ filter: expectedFilter({ searchQuery: 'eth' }) }),
      }),
    )
  })

  // A blank box must share the unsearched request (and its persisted entry) rather than send ''.
  it('omits searchQuery for a whitespace-only search string', () => {
    mockPools([buildPool()])
    renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '   ' }))
    expect(listPoolsMock).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ filter: expectedFilter() }), persist: true }),
    )
  })

  // The backend filters and paginates a searched feed itself, so every served row is shown and
  // infinite scroll keeps going — the old client-side filter froze pagination while searching.
  it('shows every served row and keeps paginating while a search is active', () => {
    mockPools([buildPool({ poolId: 'pool-1' }), buildPool({ poolId: 'pool-2' })], { hasNextPage: true })
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: 'zzz' }))
    expect(result.current.pools).toHaveLength(2)
    expect(result.current.hasNextPage).toBe(true)
  })

  // User-typed queries are an unbounded key space that is almost never rehydrated; keep them off disk.
  it('does not persist searched pages', () => {
    mockPools([buildPool()])
    renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: 'eth' }))
    expect(listPoolsMock).toHaveBeenCalledWith(expect.objectContaining({ persist: false }))
  })

  it('converts the numeric protocol version to a display label', () => {
    mockPools([buildPool({ poolId: 'pool-1', protocolVersion: ProtocolVersion.V4 })])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.protocolVersion).toBe('v4')
  })

  // Regression: the ListPools query is persisted to storage and rehydrated as plain JSON, where the
  // protobuf enum is its name ("V4") rather than the numeric value. The normalizer must still resolve
  // it, otherwise the pool table's Protocol column renders empty after a refresh.
  it('converts the persisted (enum-name) protocol version to a display label', () => {
    mockPools([buildPool({ poolId: 'pool-1', protocolVersion: 'V4' as unknown as ProtocolVersion })])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.protocolVersion).toBe('v4')
  })

  it('passes through a static fee tier as-is', () => {
    mockPools([buildPool({ poolId: 'pool-1', feeTier: 3000, tickSpacing: 60, isDynamicFee: false })])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.feeTier?.feeAmount).toBe(3000)
    expect(result.current.pools?.[0]?.feeTier?.tickSpacing).toBe(60)
    expect(result.current.pools?.[0]?.feeTier?.isDynamic).toBe(false)
  })

  // ListPools serves the pool key's fee for a dynamic-fee pool — the only value the v4-sdk accepts,
  // and what the v4 pool id hashes over. Asserted literally as 8388608, not just the named constant,
  // so a fee that stopped reaching the parser is caught even if the constant's value ever moves.
  it('carries the served sentinel feeAmount for a dynamic-fee pool', () => {
    mockPools([
      buildPool({ poolId: 'pool-dynamic', feeTier: DYNAMIC_FEE_AMOUNT, isDynamicFee: true, tickSpacing: 200 }),
    ])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.feeTier?.feeAmount).toBe(8_388_608)
    expect(result.current.pools?.[0]?.feeTier?.feeAmount).toBe(DYNAMIC_FEE_AMOUNT)
    expect(result.current.pools?.[0]?.feeTier?.tickSpacing).toBe(200)
    expect(result.current.pools?.[0]?.feeTier?.isDynamic).toBe(true)
  })

  // proto3 scalars default to 0, so an unserved tick spacing arrives as 0 rather than absent — the
  // normalizer maps it to undefined so this fallback fires instead of 0 reaching the row link's
  // `fee` param, where it would hash to the wrong v4 pool id.
  it('falls back to the default tick spacing when none is served', () => {
    mockPools([buildPool({ poolId: 'pool-1', tickSpacing: 0 })])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.feeTier?.tickSpacing).toBe(DEFAULT_TICK_SPACING)
  })

  // data.v2 serves the fixed 0.30% for v2 pairs; it reaches the tier untouched.
  it('carries the served v2 fee tier', () => {
    mockPools([buildPool({ poolId: 'pool-v2', protocolVersion: ProtocolVersion.V2, feeTier: 3000 })])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.feeTier?.feeAmount).toBe(3000)
  })

  // normalizeRankedPool returns undefined for a row with no pool identity or an unspecified
  // protocol version; those must be dropped rather than reaching the converter.
  it('drops rows the normalizer cannot represent', () => {
    mockPools([
      buildPool({ poolId: 'pool-1' }),
      { pool: undefined, stats: undefined } as PlainMessage<RankedPool>,
      buildPool({ poolId: 'pool-unspecified', protocolVersion: ProtocolVersion.UNSPECIFIED }),
    ])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools).toHaveLength(1)
    expect(result.current.pools?.[0]?.id).toBe('pool-1')
  })

  // The pool table's fee label only gains its breakdown tooltip when the row carries a served
  // protocol fee, so this passthrough is what makes the add-liquidity table match Explore.
  it('surfaces the served protocol fee', () => {
    mockPools([buildPool({ poolId: 'pool-1', protocolFee: 500 })])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.protocolFeePips).toBe(500)
  })

  // Enrichment is best-effort: an unset fee must stay undefined rather than becoming a served 0,
  // which FeeDisplay would render as a real "0%" protocol fee instead of dropping the tooltip.
  it('leaves the protocol fee undefined when none is served', () => {
    mockPools([buildPool({ poolId: 'pool-1', protocolFee: undefined })])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.protocolFeePips).toBeUndefined()
  })

  // data.v2 serves ranked stats the liquidity-service path had no schema for.
  it('surfaces the ranked stats the endpoint now serves', () => {
    mockPools([buildPool({ poolId: 'pool-1' }, { volume30d: 900, rewardApr: 0.05, volume1dTvlRatio: 0.5 })])
    const { result } = renderHook(() => useV2ListPools({ sortState: SORT_STATE, filterString: '' }))
    expect(result.current.pools?.[0]?.volume30Day?.value).toBe(900)
    expect(result.current.pools?.[0]?.boostedApr).toBe(0.05)
    expect(result.current.pools?.[0]?.volOverTvl).toBe(0.5)
  })
})

describe('useV2ListPools token filter', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  const currency = (address: string, chainId = UniverseChainId.Mainnet) =>
    ({ address, chainId, isToken: true, isNative: false }) as never

  it('matches either side with a single selected token', () => {
    mockPools([buildPool()])
    renderHook(() =>
      useV2ListPools({
        currency0: currency('0x1111111111111111111111111111111111111111'),
        sortState: SORT_STATE,
        filterString: '',
      }),
    )
    expect(listPoolsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          filter: expectedFilter({
            tokenFilter: {
              tokens: ['0x1111111111111111111111111111111111111111'],
              logicalOperator: PoolTokenLogicalOperator.OR,
            },
          }),
        }),
      }),
    )
  })

  it('requires both sides when a token pair is selected', () => {
    mockPools([buildPool()])
    renderHook(() =>
      useV2ListPools({
        currency0: currency('0x1111111111111111111111111111111111111111'),
        currency1: currency('0x2222222222222222222222222222222222222222'),
        sortState: SORT_STATE,
        filterString: '',
      }),
    )
    expect(listPoolsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          filter: expect.objectContaining({
            tokenFilter: {
              tokens: ['0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222'],
              logicalOperator: PoolTokenLogicalOperator.AND,
            },
          }),
        }),
      }),
    )
  })
})

describe('useV2ListPools protocol filter', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('narrows the request to the selected protocol version', () => {
    mockPools([buildPool()])
    renderHook(() => useV2ListPools({ protocol: ProtocolVersion.V4, sortState: SORT_STATE, filterString: '' }))
    expect(listPoolsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          filter: expect.objectContaining({ protocolVersions: [ProtocolVersion.V4] }),
        }),
      }),
    )
  })

  // "All" sends every version explicitly. PoolListFilter documents an empty list as "all protocol
  // versions", so this is equivalent to omitting the field — it just keeps one request shape across
  // both surfaces instead of letting each rely on a different default.
  it('sends every protocol version when none is selected', () => {
    mockPools([buildPool()])
    renderHook(() => useV2ListPools({ protocol: ProtocolVersion.UNSPECIFIED, sortState: SORT_STATE, filterString: '' }))
    expect(listPoolsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          filter: expect.objectContaining({ protocolVersions: ALL_PROTOCOL_VERSIONS }),
        }),
      }),
    )
  })
})
