import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { useExploreRwaRows } from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaRows'
import { useListTokenGroupsQuery } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery', () => ({
  useListTokenGroupsQuery: vi.fn(),
}))

const mockUseListTokenGroupsQuery = vi.mocked(useListTokenGroupsQuery)

const idleQuery = {
  data: undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
}

describe('useExploreRwaRows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseListTokenGroupsQuery.mockReturnValue(idleQuery as never)
  })

  it('reads from ListTokenGroups by category id', () => {
    renderHook(() =>
      useExploreRwaRows({
        category: RwaCategory.STOCKS,
        chainIds: [UniverseChainId.Mainnet],
        volumeOrderBy: TokensOrderBy.VOLUME_1D,
      }),
    )

    expect(mockUseListTokenGroupsQuery).toHaveBeenCalledWith({
      categoryId: 'stocks',
      chainIds: [UniverseChainId.Mainnet],
      orderBy: TokensOrderBy.VOLUME_1D,
      ascending: false,
      enabled: true,
    })
  })

  it('ranks by the volume window when no sort is given', () => {
    renderHook(() => useExploreRwaRows({ category: RwaCategory.STOCKS, volumeOrderBy: TokensOrderBy.VOLUME_7D }))

    expect(mockUseListTokenGroupsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: TokensOrderBy.VOLUME_7D, ascending: false }),
    )
  })

  it('forwards an explicit sort to ListTokenGroups and reports the rows as server-sorted', () => {
    const { result } = renderHook(() =>
      useExploreRwaRows({
        category: RwaCategory.STOCKS,
        volumeOrderBy: TokensOrderBy.VOLUME_1D,
        sort: { orderBy: TokensOrderBy.MARKET_CAP, ascending: true },
      }),
    )

    expect(mockUseListTokenGroupsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: TokensOrderBy.MARKET_CAP, ascending: true }),
    )
    expect(result.current.isSortedByServer).toBe(true)
  })

  it('forwards the search query to ListTokenGroups', () => {
    renderHook(() =>
      useExploreRwaRows({
        category: RwaCategory.STOCKS,
        volumeOrderBy: TokensOrderBy.VOLUME_1D,
        searchQuery: 'tesla',
      }),
    )

    expect(mockUseListTokenGroupsQuery).toHaveBeenCalledWith(expect.objectContaining({ searchQuery: 'tesla' }))
  })

  it('does not claim server order when no sort was requested', () => {
    const { result } = renderHook(() =>
      useExploreRwaRows({ category: RwaCategory.STOCKS, volumeOrderBy: TokensOrderBy.VOLUME_1D }),
    )

    expect(result.current.isSortedByServer).toBe(false)
  })

  it('reports placeholder rows from a previous query as loading', () => {
    mockUseListTokenGroupsQuery.mockReturnValue({ ...idleQuery, isPlaceholderData: true } as never)

    const { result } = renderHook(() =>
      useExploreRwaRows({ category: RwaCategory.STOCKS, volumeOrderBy: TokensOrderBy.VOLUME_1D }),
    )

    expect(result.current.isLoading).toBe(true)
  })

  it('surfaces the query loading and error state', () => {
    mockUseListTokenGroupsQuery.mockReturnValue({ ...idleQuery, isLoading: true } as never)

    const { result } = renderHook(() =>
      useExploreRwaRows({ category: RwaCategory.COMMODITIES, volumeOrderBy: TokensOrderBy.VOLUME_1D }),
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.rows).toEqual([])
  })

  it('flattens every loaded ListTokenGroups page and exposes its paging controls', () => {
    const fetchNextPage = vi.fn()
    mockUseListTokenGroupsQuery.mockReturnValue({
      ...idleQuery,
      data: { pages: [{ tokenGroups: [] }, { tokenGroups: [] }], pageParams: ['', 'next'] },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: true,
    } as never)

    const { result } = renderHook(() =>
      useExploreRwaRows({ category: RwaCategory.STOCKS, volumeOrderBy: TokensOrderBy.VOLUME_1D }),
    )

    expect(result.current.rows).toEqual([])
    expect(result.current.hasNextPage).toBe(true)
    expect(result.current.isFetchingNextPage).toBe(true)
    expect(result.current.fetchNextPage).toBe(fetchNextPage)
  })
})
