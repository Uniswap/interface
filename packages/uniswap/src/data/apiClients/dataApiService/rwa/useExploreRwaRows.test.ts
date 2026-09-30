import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { useListRankedRwasQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas'
import { useExploreRwaRows } from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaRows'
import { useListTokenGroupsQuery } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseIsTokenCategoriesEnabled } = vi.hoisted(() => ({ mockUseIsTokenCategoriesEnabled: vi.fn() }))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: mockUseIsTokenCategoriesEnabled,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas', () => ({
  useListRankedRwasQuery: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery', () => ({
  useListTokenGroupsQuery: vi.fn(),
}))

const mockUseListRankedRwasQuery = vi.mocked(useListRankedRwasQuery)
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
    mockUseListRankedRwasQuery.mockReturnValue(idleQuery as never)
    mockUseListTokenGroupsQuery.mockReturnValue(idleQuery as never)
  })

  it('reads from ListTokenGroups by category id when token categories are on', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)

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
    expect(mockUseListRankedRwasQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('ranks by the volume window when no sort is given', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)

    renderHook(() => useExploreRwaRows({ category: RwaCategory.STOCKS, volumeOrderBy: TokensOrderBy.VOLUME_7D }))

    expect(mockUseListTokenGroupsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: TokensOrderBy.VOLUME_7D, ascending: false }),
    )
  })

  it('forwards an explicit sort to ListTokenGroups and reports the rows as server-sorted', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)

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

  it('falls back to ListRankedRwas when token categories are off', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(false)

    renderHook(() => useExploreRwaRows({ category: RwaCategory.ETFS, volumeOrderBy: TokensOrderBy.VOLUME_1D }))

    expect(mockUseListRankedRwasQuery).toHaveBeenCalledWith({
      category: RwaCategory.ETFS,
      chainIds: [],
      includeSparkline1d: true,
      enabled: true,
    })
    expect(mockUseListTokenGroupsQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('does not claim server order when no sort was requested', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)

    const { result } = renderHook(() =>
      useExploreRwaRows({ category: RwaCategory.STOCKS, volumeOrderBy: TokensOrderBy.VOLUME_1D }),
    )

    expect(result.current.isSortedByServer).toBe(false)
  })

  it('reports placeholder rows from a previous query as loading', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    mockUseListTokenGroupsQuery.mockReturnValue({ ...idleQuery, isPlaceholderData: true } as never)

    const { result } = renderHook(() =>
      useExploreRwaRows({ category: RwaCategory.STOCKS, volumeOrderBy: TokensOrderBy.VOLUME_1D }),
    )

    expect(result.current.isLoading).toBe(true)
  })

  it('surfaces the active source loading and error state', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    mockUseListTokenGroupsQuery.mockReturnValue({ ...idleQuery, isLoading: true } as never)
    mockUseListRankedRwasQuery.mockReturnValue({ ...idleQuery, isError: true } as never)

    const { result } = renderHook(() =>
      useExploreRwaRows({ category: RwaCategory.COMMODITIES, volumeOrderBy: TokensOrderBy.VOLUME_1D }),
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.rows).toEqual([])
  })

  it('flattens every loaded ListTokenGroups page and exposes its paging controls', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
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

  it('reports no further pages from the v1 source', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(false)
    mockUseListTokenGroupsQuery.mockReturnValue({ ...idleQuery, hasNextPage: true } as never)

    const { result } = renderHook(() =>
      useExploreRwaRows({ category: RwaCategory.ETFS, volumeOrderBy: TokensOrderBy.VOLUME_1D }),
    )

    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.isFetchingNextPage).toBe(false)
    expect(result.current.isSortedByServer).toBe(false)
  })
})
