import { renderHook } from '@testing-library/react'
import { useHomeScreenHeartbeatCoordinator } from 'src/screens/HomeScreen/portfolio/hooks/useHomeScreenHeartbeatCoordinator'
import { HomeTab } from 'src/screens/HomeScreen/portfolio/types'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const mockQueryClientRefetchQueries = jest.fn().mockResolvedValue(undefined)
const mockApolloRefetchQueries = jest.fn().mockResolvedValue(undefined)

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ refetchQueries: mockQueryClientRefetchQueries }),
}))

jest.mock('@apollo/client', () => ({
  useApolloClient: () => ({ refetchQueries: mockApolloRefetchQueries }),
}))

jest.mock('src/utils/useHeartbeatCoordinator', () => ({
  useHeartbeatCoordinator: jest.fn(),
}))

const mockUseHeartbeatCoordinator = jest.mocked(useHeartbeatCoordinator)

describe('useHomeScreenHeartbeatCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQueryClientRefetchQueries.mockReset().mockResolvedValue(undefined)
    mockApolloRefetchQueries.mockReset().mockResolvedValue(undefined)
  })

  it('passes enabled through to the shared coordinator', () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ enabled: true, activeTab: HomeTab.Tokens }))

    expect(mockUseHeartbeatCoordinator).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, refresh: expect.any(Function), priceRefresh: expect.any(Function) }),
    )
  })

  it('refetches balances, the Tokens tab list, and the portfolio chart, but not positions, on refresh when Tokens is active', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ enabled: true, activeTab: HomeTab.Tokens }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetWalletBalances] })
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetPortfolio] })
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetPortfolioChart] })
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.ListPositions] })
  })

  it('refetches the Tokens tab list on priceRefresh when Tokens is active', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ enabled: true, activeTab: HomeTab.Tokens }))

    const { priceRefresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await priceRefresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetWalletBalances] })
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetPortfolio] })
  })

  it('also refetches positions on refresh when Pools is active, but not the Tokens tab list', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ enabled: true, activeTab: HomeTab.Pools }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.ListPositions] })
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetPortfolio] })
  })

  it('only refetches balances on priceRefresh when Pools is active', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ enabled: true, activeTab: HomeTab.Pools }))

    const { priceRefresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await priceRefresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(1)
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetWalletBalances] })
  })

  it('refetches NFTs on refresh when NFTs is active, but not positions or the Tokens tab list', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ enabled: true, activeTab: HomeTab.NFTs }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockApolloRefetchQueries).toHaveBeenCalledWith({ include: ['NftsTab'] })
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.ListPositions] })
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetPortfolio] })
  })

  it('does not refetch NFTs when a different tab is active', async () => {
    renderHook(() => useHomeScreenHeartbeatCoordinator({ enabled: true, activeTab: HomeTab.Tokens }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockApolloRefetchQueries).not.toHaveBeenCalled()
  })
})
