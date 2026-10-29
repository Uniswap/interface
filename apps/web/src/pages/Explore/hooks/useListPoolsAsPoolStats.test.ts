import { useInfiniteQuery } from '@tanstack/react-query'
import { useListPoolsAsPoolStats } from '~/pages/Explore/hooks/useListPoolsAsPoolStats'
import { renderHook } from '~/test-utils/render'

vi.mock('@tanstack/react-query', async () => ({
  ...(await vi.importActual('@tanstack/react-query')),
  useInfiniteQuery: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/pools/queries', () => ({
  getListPoolsInfiniteQueryOptions: vi.fn(() => ({})),
}))

vi.mock('~/features/Liquidity/utils/normalizeRankedPool', () => ({
  normalizeRankedPool: vi.fn((ranked: { pool?: { chainId: number; poolId: string } }) => {
    const pool = ranked.pool
    if (!pool?.poolId) {
      return undefined
    }
    return { chainId: pool.chainId, poolId: pool.poolId }
  }),
}))

vi.mock('~/features/Liquidity/utils/convertPoolToPoolStat', () => ({
  convertPoolToPoolStat: vi.fn((pool: { chainId: number; poolId: string }) => ({
    id: pool.poolId,
    chainId: pool.chainId,
  })),
}))

const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery)

function mockResponse(pools: unknown[]) {
  mockUseInfiniteQuery.mockReturnValue({
    data: { pages: [{ pools }], pageParams: [undefined] },
    isLoading: false,
    isSuccess: true,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  } as unknown as ReturnType<typeof useInfiniteQuery>)
}

describe('useListPoolsAsPoolStats', () => {
  it('preserves raw pool presence when normalization drops a row', () => {
    mockResponse([{}])

    const { result } = renderHook(() => useListPoolsAsPoolStats({ params: {}, pageSize: 20, enabled: true }))

    expect(result.current.pools).toEqual([])
    expect(result.current.rawPoolCount).toBe(1)
  })

  it('reports zero only for a successful raw empty response', () => {
    mockResponse([])

    const { result } = renderHook(() => useListPoolsAsPoolStats({ params: {}, pageSize: 20, enabled: true }))

    expect(result.current.rawPoolCount).toBe(0)
  })

  it('keeps a single row when the same pool key appears twice across pages', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            pools: [
              { pool: { chainId: 10, poolId: 'pool-a' } },
              { pool: { chainId: 10, poolId: 'pool-b' } },
            ],
          },
          {
            pools: [
              { pool: { chainId: 10, poolId: 'pool-a' } },
              { pool: { chainId: 10, poolId: 'pool-c' } },
            ],
          },
        ],
        pageParams: [undefined, 'cursor'],
      },
      isLoading: false,
      isSuccess: true,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useInfiniteQuery>)

    const { result } = renderHook(() => useListPoolsAsPoolStats({ params: {}, pageSize: 20, enabled: true }))

    expect(result.current.pools?.map((pool) => pool.id)).toEqual(['pool-a', 'pool-b', 'pool-c'])
    expect(result.current.rawPoolCount).toBe(4)
  })
})
