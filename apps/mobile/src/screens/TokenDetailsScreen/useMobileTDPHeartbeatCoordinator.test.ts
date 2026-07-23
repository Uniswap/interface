import { renderHook } from '@testing-library/react'
import { useMobileTDPHeartbeatCoordinator } from 'src/screens/TokenDetailsScreen/useMobileTDPHeartbeatCoordinator'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const mockApolloRefetchQueries = jest.fn().mockResolvedValue(undefined)
const mockQueryClientRefetchQueries = jest.fn().mockResolvedValue(undefined)

jest.mock('@apollo/client', () => ({
  useApolloClient: () => ({ refetchQueries: mockApolloRefetchQueries }),
}))

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ refetchQueries: mockQueryClientRefetchQueries }),
}))

jest.mock('@universe/gating', () => ({
  FeatureFlags: { Earn: 'earn' },
  useFeatureFlag: jest.fn(),
}))

jest.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddress: jest.fn(),
}))

jest.mock('src/utils/useHeartbeatCoordinator', () => ({
  useHeartbeatCoordinator: jest.fn(),
}))

const mockUseFeatureFlag = jest.mocked(
  (jest.requireMock('@universe/gating') as { useFeatureFlag: jest.Mock }).useFeatureFlag,
)
const mockUseActiveAccountAddress = jest.mocked(
  (jest.requireMock('wallet/src/features/wallet/hooks') as { useActiveAccountAddress: jest.Mock })
    .useActiveAccountAddress,
)
const mockUseHeartbeatCoordinator = jest.mocked(useHeartbeatCoordinator)

describe('useMobileTDPHeartbeatCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApolloRefetchQueries.mockReset().mockResolvedValue(undefined)
    mockQueryClientRefetchQueries.mockReset().mockResolvedValue(undefined)
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseActiveAccountAddress.mockReturnValue(undefined)
  })

  it('passes enabled through to the shared coordinator', () => {
    renderHook(() => useMobileTDPHeartbeatCoordinator({ enabled: true }))

    expect(mockUseHeartbeatCoordinator).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, refresh: expect.any(Function), priceRefresh: expect.any(Function) }),
    )
  })

  it('refetches token stats, price history, and balances on refresh', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    renderHook(() => useMobileTDPHeartbeatCoordinator({ enabled: true }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockApolloRefetchQueries).toHaveBeenCalledWith({ include: ['TokenDetailsScreen'] })
    expect(mockApolloRefetchQueries).toHaveBeenCalledWith({ include: ['TokenPriceHistory'] })
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetPortfolio] })
  })

  it('refetches price only after everything else has settled', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    const resolutionOrder: string[] = []
    mockApolloRefetchQueries.mockImplementation(({ include }: { include: string[] }) => {
      resolutionOrder.push(include[0]!)
      return Promise.resolve(undefined)
    })
    mockQueryClientRefetchQueries.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      resolutionOrder.push(queryKey[0]!)
      return Promise.resolve(undefined)
    })

    renderHook(() => useMobileTDPHeartbeatCoordinator({ enabled: true }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(resolutionOrder).toEqual(['TokenDetailsScreen', 'GetPortfolio', 'TokenPriceHistory'])
  })

  it('only refetches token price history on priceRefresh', async () => {
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    renderHook(() => useMobileTDPHeartbeatCoordinator({ enabled: true }))

    const { priceRefresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await priceRefresh()

    expect(mockApolloRefetchQueries).toHaveBeenCalledWith({ include: ['TokenPriceHistory'] })
    expect(mockApolloRefetchQueries).toHaveBeenCalledTimes(1)
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalled()
  })

  it('skips balances and earn refetches when there is no active address', async () => {
    mockUseFeatureFlag.mockReturnValue(true)
    mockUseActiveAccountAddress.mockReturnValue(undefined)
    renderHook(() => useMobileTDPHeartbeatCoordinator({ enabled: true }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalled()
  })

  it('skips earn refetches when the earn feature flag is disabled', async () => {
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    renderHook(() => useMobileTDPHeartbeatCoordinator({ enabled: true }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.GetPortfolio] })
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['listEarnVaults']) }),
    )
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['listEarnPositions']) }),
    )
  })

  it('refetches earn vaults and positions when earn is enabled and there is an active address', async () => {
    mockUseFeatureFlag.mockReturnValue(true)
    mockUseActiveAccountAddress.mockReturnValue('0xabc')
    renderHook(() => useMobileTDPHeartbeatCoordinator({ enabled: true }))

    const { refresh } = mockUseHeartbeatCoordinator.mock.calls[0]![0]
    await refresh()

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnVaults'],
    })
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith({
      queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'],
    })
  })
})
