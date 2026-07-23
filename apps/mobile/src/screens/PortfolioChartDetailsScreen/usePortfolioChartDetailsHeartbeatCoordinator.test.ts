import { renderHook } from '@testing-library/react'
import { usePortfolioChartDetailsHeartbeatCoordinator } from 'src/screens/PortfolioChartDetailsScreen/usePortfolioChartDetailsHeartbeatCoordinator'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const mockQueryClientRefetchQueries = jest.fn().mockResolvedValue(undefined)

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ refetchQueries: mockQueryClientRefetchQueries }),
}))

jest.mock('src/utils/useHeartbeatCoordinator', () => ({
  useHeartbeatCoordinator: jest.fn(),
}))

const mockUseHeartbeatCoordinator = jest.mocked(useHeartbeatCoordinator)

describe('usePortfolioChartDetailsHeartbeatCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQueryClientRefetchQueries.mockReset().mockResolvedValue(undefined)
  })

  it('passes enabled through to the shared coordinator', () => {
    renderHook(() => usePortfolioChartDetailsHeartbeatCoordinator({ enabled: true }))

    expect(mockUseHeartbeatCoordinator).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, refresh: expect.any(Function), priceRefresh: expect.any(Function) }),
    )
  })

  it('refetches balances, the chart, and PnL on refresh', async () => {
    renderHook(() => usePortfolioChartDetailsHeartbeatCoordinator({ enabled: true }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetWalletBalances] })
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetPortfolioChart] })
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetWalletProfitLoss] })
  })

  it('only refetches balances on priceRefresh', async () => {
    renderHook(() => usePortfolioChartDetailsHeartbeatCoordinator({ enabled: true }))

    const { priceRefresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await priceRefresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(1)
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetWalletBalances] })
  })
})
