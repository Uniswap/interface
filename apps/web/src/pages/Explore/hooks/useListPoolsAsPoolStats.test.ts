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
})
