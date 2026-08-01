import { renderHook, act } from '@testing-library/react'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { useInterval } from '~/lib/hooks/useInterval'
import { TDP_HEARTBEAT_INTERVAL_MS } from '~/pages/TokenDetails/hooks/tdpHeartbeatConstants'
import { useTDPHeartbeatCoordinator } from '~/pages/TokenDetails/hooks/useTDPHeartbeatCoordinator'

const mockRefetchQueries = vi.fn().mockResolvedValue(undefined)
const mockQueryClientRefetchQueries = vi.fn().mockResolvedValue(undefined)

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useApolloClient: () => ({ refetchQueries: mockRefetchQueries }),
  }
})

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({ refetchQueries: mockQueryClientRefetchQueries }),
  }
})

vi.mock('uniswap/src/features/earn/hooks/useIsEarnEnabled', () => ({
  useIsEarnEnabled: vi.fn(),
}))

vi.mock('~/features/accounts/store/hooks', () => ({
  useActiveAddresses: vi.fn(),
}))

vi.mock('~/lib/hooks/useInterval', () => ({
  useInterval: vi.fn(),
}))

const mockUseIsEarnEnabled = vi.mocked(useIsEarnEnabled)
const mockUseActiveAddresses = vi.mocked(useActiveAddresses)
const mockUseInterval = vi.mocked(useInterval)

function makeParams(overrides?: Partial<Parameters<typeof useTDPHeartbeatCoordinator>[0]>) {
  return {
    tokenQueryRefetch: vi.fn().mockResolvedValue(undefined),
    balancesRefetch: vi.fn(),
    incrementRefreshEpoch: vi.fn(),
    enabled: true,
    ...overrides,
  }
}

describe('useTDPHeartbeatCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    mockUseIsEarnEnabled.mockReturnValue(false)
    mockUseActiveAddresses.mockReturnValue({ evmAddress: undefined, svmAddress: undefined })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
  })

  it('passes the heartbeat interval when enabled and visible', () => {
    renderHook(() => useTDPHeartbeatCoordinator(makeParams()))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBe(TDP_HEARTBEAT_INTERVAL_MS)
  })

  it('passes null delay when disabled', () => {
    renderHook(() => useTDPHeartbeatCoordinator(makeParams({ enabled: false })))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBeNull()
  })

  it('passes null delay when tab is hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })

    renderHook(() => useTDPHeartbeatCoordinator(makeParams()))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBeNull()
  })

  it('calls all sources on a tick', async () => {
    mockUseActiveAddresses.mockReturnValue({ evmAddress: '0xabc', svmAddress: undefined })
    const params = makeParams()
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(params.tokenQueryRefetch).toHaveBeenCalledOnce()
    expect(params.balancesRefetch).toHaveBeenCalledOnce()
    expect(mockRefetchQueries).toHaveBeenCalledWith({
      include: ['TokenHistoricalVolumes', 'TokenHistoricalTvls'],
    })
  })

  it('skips earn queries when earn feature flag is disabled', async () => {
    mockUseIsEarnEnabled.mockReturnValue(false)
    mockUseActiveAddresses.mockReturnValue({ evmAddress: '0xabc', svmAddress: undefined })

    const params = makeParams()
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledOnce()
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['listEarnVaults']) }),
    )
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['listEarnPositions']) }),
    )
  })

  it('skips earn queries when no evm account is connected', async () => {
    mockUseIsEarnEnabled.mockReturnValue(true)
    mockUseActiveAddresses.mockReturnValue({ evmAddress: undefined, svmAddress: undefined })

    const params = makeParams()
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalled()
  })

  it('fires both earn query keys when earn is enabled and account is connected', async () => {
    mockUseIsEarnEnabled.mockReturnValue(true)
    mockUseActiveAddresses.mockReturnValue({ evmAddress: '0xabc', svmAddress: undefined })

    const params = makeParams()
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(3)
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['GetWalletTokenProfitLoss']) }),
    )
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['listEarnVaults']) }),
    )
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['listEarnPositions']) }),
    )
  })

  it('increments refreshEpoch after all sources settle', async () => {
    const params = makeParams()
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(params.incrementRefreshEpoch).toHaveBeenCalledOnce()
  })

  it('still increments refreshEpoch even when one source rejects', async () => {
    const params = makeParams({
      tokenQueryRefetch: vi.fn().mockRejectedValue(new Error('network error')),
    })
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(params.incrementRefreshEpoch).toHaveBeenCalledOnce()
  })

  it('uses leading=false so the first tick is deferred', () => {
    renderHook(() => useTDPHeartbeatCoordinator(makeParams()))

    const [, , leading] = mockUseInterval.mock.calls[0]!
    expect(leading).toBe(false)
  })
})
