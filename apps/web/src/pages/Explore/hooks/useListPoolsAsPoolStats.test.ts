import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Pool, PoolRankStats, RankedPool } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useListPoolsAsPoolStats } from '~/pages/Explore/hooks/useListPoolsAsPoolStats'
import { renderHook } from '~/test-utils/render'

vi.mock('@tanstack/react-query', async () => ({
  ...(await vi.importActual('@tanstack/react-query')),
  useInfiniteQuery: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/pools/queries', () => ({
  getListPoolsInfiniteQueryOptions: vi.fn(() => ({})),
}))

const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery)

function mockResponse(pools: unknown[], isFetchNextPageError = false) {
  mockUseInfiniteQuery.mockReturnValue({
    data: { pages: [{ pools }], pageParams: [undefined] },
    isLoading: false,
    isFetching: false,
    isPlaceholderData: false,
    isSuccess: true,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError,
  } as unknown as ReturnType<typeof useInfiniteQuery>)
}

describe('useListPoolsAsPoolStats', () => {
  it('preserves raw pool presence when normalization drops a row', () => {
    mockResponse([{}])

    const { result } = renderHook(() => useListPoolsAsPoolStats({ params: {}, pageSize: 20, enabled: true }))

    expect(result.current.pools).toEqual([])
    expect(result.current.rawPoolCount).toBe(1)
  })

  it('keeps prior rows opt-in without changing other pool queries', () => {
    mockResponse([])
    const { rerender } = renderHook(
      ({ keepPreviousRows }: { keepPreviousRows: boolean }) =>
        useListPoolsAsPoolStats({
          params: {},
          pageSize: 20,
          enabled: true,
          keepPreviousRows,
        }),
      { initialProps: { keepPreviousRows: false } },
    )

    expect(mockUseInfiniteQuery.mock.lastCall?.[0]).toHaveProperty('placeholderData', undefined)
    rerender({ keepPreviousRows: true })
    expect(mockUseInfiniteQuery.mock.lastCall?.[0]).toHaveProperty('placeholderData', keepPreviousData)
  })

  it('exposes refresh and placeholder flags while keeping the served pool rows', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            pools: [
              new RankedPool({
                pool: new Pool({ poolId: 'retained-pool', chainId: 1, protocolVersion: ProtocolVersion.V4 }),
              }),
            ],
          },
        ],
        pageParams: [''],
      },
      isLoading: false,
      isFetching: true,
      isPlaceholderData: true,
      error: null,
    } as unknown as ReturnType<typeof useInfiniteQuery>)

    const { result } = renderHook(() =>
      useListPoolsAsPoolStats({ params: {}, pageSize: 20, enabled: true, keepPreviousRows: true }),
    )

    expect(result.current.isFetching).toBe(true)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.pools?.map((pool) => pool.id)).toEqual(['retained-pool'])
  })

  it('reports zero only for a successful raw empty response', () => {
    mockResponse([])

    const { result } = renderHook(() => useListPoolsAsPoolStats({ params: {}, pageSize: 20, enabled: true }))

    expect(result.current.rawPoolCount).toBe(0)
  })

  it.each([
    { label: 'missing stats', stats: undefined, expected: undefined },
    { label: 'missing TVL', stats: new PoolRankStats(), expected: undefined },
    { label: 'zero TVL', stats: new PoolRankStats({ tvl: 0 }), expected: { value: 0 } },
    { label: 'positive TVL', stats: new PoolRankStats({ tvl: 123.45 }), expected: { value: 123.45 } },
    { label: 'non-finite TVL', stats: new PoolRankStats({ tvl: Number.NaN }), expected: undefined },
    { label: 'infinite TVL', stats: new PoolRankStats({ tvl: Number.POSITIVE_INFINITY }), expected: undefined },
  ])('preserves $label at the PoolStat boundary', ({ stats, expected }) => {
    mockResponse([
      new RankedPool({
        pool: new Pool({ poolId: 'pool-1', chainId: 1, protocolVersion: ProtocolVersion.V4 }),
        stats,
      }),
    ])

    const { result } = renderHook(() => useListPoolsAsPoolStats({ params: {}, pageSize: 20, enabled: true }))

    expect(result.current.pools).toHaveLength(1)
    expect(result.current.pools?.[0].totalLiquidity).toEqual(expected)
  })

  it('exposes a next-page error separately while retaining loaded rows', () => {
    mockResponse(
      [
        new RankedPool({
          pool: new Pool({ poolId: 'pool-1', chainId: 1, protocolVersion: ProtocolVersion.V4 }),
          stats: new PoolRankStats({ tvl: 12 }),
        }),
      ],
      true,
    )

    const { result } = renderHook(() => useListPoolsAsPoolStats({ params: {}, pageSize: 20, enabled: true }))

    expect(result.current.isFetchNextPageError).toBe(true)
    expect(result.current.pools?.[0].id).toBe('pool-1')
  })
})
