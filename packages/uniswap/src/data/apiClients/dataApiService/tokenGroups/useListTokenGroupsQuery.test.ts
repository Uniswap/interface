import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useListTokenGroupsQuery } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useListTokenGroupsQuery'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'

const { mockUseEnabledChains } = vi.hoisted(() => ({ mockUseEnabledChains: vi.fn() }))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { listTokenGroups: vi.fn() },
}))

const mockListTokenGroups = vi.mocked(dataApiServiceClientV2.listTokenGroups)

describe('useListTokenGroupsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet, UniverseChainId.Base] })
    mockListTokenGroups.mockResolvedValue({ tokenGroups: [] } as never)
  })

  it('requests the category with explicit chainIds, volume sort, and a required sparkline duration', async () => {
    renderHook(() =>
      useListTokenGroupsQuery({
        categoryId: 'stocks',
        chainIds: [UniverseChainId.Base],
        orderBy: TokensOrderBy.VOLUME_1D,
      }),
    )

    await waitFor(() => expect(mockListTokenGroups).toHaveBeenCalledTimes(1))
    expect(mockListTokenGroups).toHaveBeenCalledWith(
      expect.objectContaining({
        chainIds: [UniverseChainId.Base],
        filter: { categoryIds: ['stocks'] },
        sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
        sparklineDuration: HistoryDuration.DAY,
      }),
    )
  })

  it('forwards the requested ranking and direction', async () => {
    renderHook(() =>
      useListTokenGroupsQuery({
        categoryId: 'stocks',
        chainIds: [UniverseChainId.Base],
        orderBy: TokensOrderBy.MARKET_CAP,
        ascending: true,
      }),
    )

    await waitFor(() => expect(mockListTokenGroups).toHaveBeenCalledTimes(1))
    expect(mockListTokenGroups).toHaveBeenCalledWith(
      expect.objectContaining({ sort: { orderBy: TokensOrderBy.MARKET_CAP, ascending: true } }),
    )
  })

  it('falls back to the enabled chains when no chainIds are given', async () => {
    renderHook(() => useListTokenGroupsQuery({ categoryId: 'etfs', chainIds: [], orderBy: TokensOrderBy.VOLUME_1D }))

    await waitFor(() => expect(mockListTokenGroups).toHaveBeenCalledTimes(1))
    expect(mockListTokenGroups).toHaveBeenCalledWith(
      expect.objectContaining({ chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base] }),
    )
  })

  it('does not fetch without a category id or when disabled', () => {
    renderHook(() =>
      useListTokenGroupsQuery({
        categoryId: undefined,
        chainIds: [UniverseChainId.Mainnet],
        orderBy: TokensOrderBy.VOLUME_1D,
      }),
    )
    renderHook(() =>
      useListTokenGroupsQuery({
        categoryId: 'stocks',
        chainIds: [],
        enabled: false,
        orderBy: TokensOrderBy.VOLUME_1D,
      }),
    )

    expect(mockListTokenGroups).not.toHaveBeenCalled()
  })

  it('starts from an empty page token and pages forward with the BE next token', async () => {
    mockListTokenGroups
      .mockResolvedValueOnce({ tokenGroups: [], page: { nextPageToken: 'page-2' } } as never)
      .mockResolvedValueOnce({ tokenGroups: [], page: { nextPageToken: '' } } as never)

    // Distinct key: the shared test QueryClient would otherwise serve the earlier test's cached page.
    const { result } = renderHook(() =>
      useListTokenGroupsQuery({
        categoryId: 'commodities',
        chainIds: [UniverseChainId.Base],
        orderBy: TokensOrderBy.VOLUME_1D,
      }),
    )

    await waitFor(() => expect(result.current.hasNextPage).toBe(true))
    expect(mockListTokenGroups).toHaveBeenCalledWith(
      expect.objectContaining({ page: { pageSize: 100, pageToken: '' } }),
    )

    void result.current.fetchNextPage()

    await waitFor(() => expect(mockListTokenGroups).toHaveBeenCalledTimes(2))
    expect(mockListTokenGroups).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: { pageSize: 100, pageToken: 'page-2' } }),
    )
    await waitFor(() => expect(result.current.hasNextPage).toBe(false))
  })
})
