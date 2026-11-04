import { renderHook, act } from '@testing-library/react'
import { useDynamicConfigValue } from '@universe/gating'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useActiveAddresses } from '~/connection/accounts/hooks'
import { useInterval } from '~/lib/hooks/useInterval'
import { useTDPHeartbeatCoordinator } from '~/pages/TokenDetails/hooks/useTDPHeartbeatCoordinator'

const mockQueryClientRefetchQueries = vi.fn().mockResolvedValue(undefined)

const PRICE_QUERY_NAMES = ['getTokenMultiChain', 'getTokenHistoryPrice', 'getTokenHistoryOHLC']

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({ refetchQueries: mockQueryClientRefetchQueries }),
  }
})

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('@universe/gating')>()),
    useDynamicConfigValue: vi.fn(),
  }
})

vi.mock('~/connection/accounts/hooks', () => ({
  useActiveAddresses: vi.fn(),
}))

vi.mock('~/lib/hooks/useInterval', () => ({
  useInterval: vi.fn(),
}))

const mockUseActiveAddresses = vi.mocked(useActiveAddresses)
const mockUseInterval = vi.mocked(useInterval)
const mockUseDynamicConfigValue = vi.mocked(useDynamicConfigValue)

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
    mockUseDynamicConfigValue.mockReturnValue(60)
    mockUseActiveAddresses.mockReturnValue({ evmAddress: undefined, svmAddress: undefined })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
  })

  it('passes half the configured poll interval (the price cadence) when enabled and visible', () => {
    renderHook(() => useTDPHeartbeatCoordinator(makeParams()))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBe(PollingInterval.KindaFast) // 60s config → 30s price tick
  })

  it('passes null delay when the synchronized heartbeats config is 0', () => {
    // With heartbeats off the TDP price chart self-polls instead (see useTokenPriceChartPanel).
    mockUseDynamicConfigValue.mockReturnValue(0)

    renderHook(() => useTDPHeartbeatCoordinator(makeParams()))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBeNull()
  })

  it('refetches the REST price queries on the price tick', async () => {
    const params = makeParams()
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    for (const name of PRICE_QUERY_NAMES) {
      expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: expect.arrayContaining([name]), type: 'active' }),
      )
    }
  })

  it('fires the full refresh only on every other tick', async () => {
    const params = makeParams()
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback() // full + price
      await callback() // price only
    })

    expect(params.tokenQueryRefetch).toHaveBeenCalledOnce()
    // Price queries fire on both ticks; the full refresh adds nothing here (no connected account)
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(PRICE_QUERY_NAMES.length * 2)
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
    for (const name of PRICE_QUERY_NAMES) {
      expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: expect.arrayContaining([name]), type: 'active' }),
      )
    }
  })

  it('skips earn and PnL queries when no account is connected', async () => {
    mockUseActiveAddresses.mockReturnValue({ evmAddress: undefined, svmAddress: undefined })

    const params = makeParams()
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(params.balancesRefetch).not.toHaveBeenCalled()
    for (const name of ['GetWalletTokenProfitLoss', 'listEarnVaults', 'listEarnPositions']) {
      expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: expect.arrayContaining([name]) }),
      )
    }
  })

  it('refetches balances and PnL but not earn for an svm-only wallet', async () => {
    mockUseActiveAddresses.mockReturnValue({
      evmAddress: undefined,
      svmAddress: 'So11111111111111111111111111111111111111112',
    })

    const params = makeParams()
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(params.balancesRefetch).toHaveBeenCalledOnce()
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['GetWalletTokenProfitLoss']) }),
    )
    expect(mockQueryClientRefetchQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['listEarnVaults']) }),
    )
  })

  it('fires both earn query keys when an evm account is connected', async () => {
    mockUseActiveAddresses.mockReturnValue({ evmAddress: '0xabc', svmAddress: undefined })

    const params = makeParams()
    renderHook(() => useTDPHeartbeatCoordinator(params))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

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
