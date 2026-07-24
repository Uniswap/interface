import { renderHook } from '@testing-library/react'
import { useFeatureFlag } from '@universe/gating'
import { useMobileTDPHeartbeatCoordinator } from 'src/screens/TokenDetailsScreen/useMobileTDPHeartbeatCoordinator'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const mockApolloRefetchQueries = vi.fn().mockResolvedValue(undefined)
const mockQueryClientRefetchQueries = vi.fn().mockResolvedValue(undefined)

vi.mock('@apollo/client', () => ({
  useApolloClient: () => ({ refetchQueries: mockApolloRefetchQueries }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ refetchQueries: mockQueryClientRefetchQueries }),
}))

vi.mock('@universe/gating', () => ({
  FeatureFlags: { Earn: 'earn' },
  useFeatureFlag: vi.fn(),
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddress: vi.fn(),
}))

vi.mock('src/utils/useHeartbeatCoordinator', () => ({
  useHeartbeatCoordinator: vi.fn(),
}))

const mockUseFeatureFlag = vi.mocked(useFeatureFlag)
const mockUseActiveAccountAddress = vi.mocked(useActiveAccountAddress)
const mockUseHeartbeatCoordinator = vi.mocked(useHeartbeatCoordinator)

describe('useMobileTDPHeartbeatCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApolloRefetchQueries.mockReset().mockResolvedValue(undefined)
    mockQueryClientRefetchQueries.mockReset().mockResolvedValue(undefined)
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseActiveAccountAddress.mockReturnValue(null)
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
    mockUseActiveAccountAddress.mockReturnValue(null)
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
