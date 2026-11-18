import { renderHook } from '@testing-library/react'
import { NFT_QUERY_KEY_PREFIX } from '@universe/data-api'
import { useHomeScreenHeartbeatCoordinator } from 'src/screens/HomeScreen/portfolio/hooks/useHomeScreenHeartbeatCoordinator'
import { HomeTab } from 'src/screens/HomeScreen/portfolio/types'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { WALLET_POSITIONS_QUERY_KEY_PREFIX } from 'uniswap/src/data/apiClients/liquidityService/queryKeys'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const mockQueryClientRefetchQueries = vi.fn().mockResolvedValue(undefined)

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ refetchQueries: mockQueryClientRefetchQueries }),
}))

vi.mock('src/utils/useHeartbeatCoordinator', () => ({
  useHeartbeatCoordinator: vi.fn(),
}))

const mockUseHeartbeatCoordinator = vi.mocked(useHeartbeatCoordinator)

describe('useHomeScreenHeartbeatCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryClientRefetchQueries.mockReset().mockResolvedValue(undefined)
  })

  it('passes refresh callbacks through to the shared coordinator', () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ activeTab: HomeTab.Tokens }))

    expect(mockUseHeartbeatCoordinator).toHaveBeenCalledWith(
      expect.objectContaining({ refresh: expect.any(Function), priceRefresh: expect.any(Function) }),
    )
  })

  it('refetches balances and the Tokens tab list, but not the chart or positions, on refresh when Tokens is active', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ activeTab: HomeTab.Tokens }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.GetWalletBalances],
      type: 'active',
    })
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.GetPortfolio],
      type: 'active',
    })
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetPortfolioChart] }),
    )
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: WALLET_POSITIONS_QUERY_KEY_PREFIX }),
    )
  })

  it('refetches only the Tokens tab list on priceRefresh when Tokens is active', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ activeTab: HomeTab.Tokens }))

    const { priceRefresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await priceRefresh?.()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(1)
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.GetPortfolio],
      type: 'active',
    })
  })

  it('refetches nothing on priceRefresh when Tokens is not active', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ activeTab: HomeTab.Pools }))

    const { priceRefresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await priceRefresh?.()

    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalled()
  })

  it('also refetches positions on refresh when Pools is active, but not the Tokens tab list', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ activeTab: HomeTab.Pools }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({
      queryKey: WALLET_POSITIONS_QUERY_KEY_PREFIX,
      type: 'active',
    })
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetPortfolio] }),
    )
  })

  it('refetches NFTs on refresh when NFTs is active, but not positions or the Tokens tab list', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ activeTab: HomeTab.NFTs }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: NFT_QUERY_KEY_PREFIX, type: 'active' })
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: WALLET_POSITIONS_QUERY_KEY_PREFIX }),
    )
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetPortfolio] }),
    )
  })

  it('does not refetch NFTs on priceRefresh or while another tab is active', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ activeTab: HomeTab.NFTs }))
    const { priceRefresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await priceRefresh?.()

    renderHook(() => useHomeScreenHeartbeatCoordinator({ activeTab: HomeTab.Tokens }))
    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[1]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: NFT_QUERY_KEY_PREFIX }),
    )
  })
})
