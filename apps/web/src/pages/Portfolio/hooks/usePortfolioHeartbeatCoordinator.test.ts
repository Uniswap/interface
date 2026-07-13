import { renderHook, act } from '@testing-library/react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useInterval } from '~/lib/hooks/useInterval'
import { usePortfolioHeartbeatCoordinator } from '~/pages/Portfolio/hooks/usePortfolioHeartbeatCoordinator'
import { PortfolioTab } from '~/pages/Portfolio/types'

const mockRefetchQueries = vi.fn().mockResolvedValue(undefined)

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ refetchQueries: mockRefetchQueries }),
}))

vi.mock('~/lib/hooks/useInterval', () => ({
  useInterval: vi.fn(),
}))

const mockUseInterval = vi.mocked(useInterval)

function makeParams(overrides?: Partial<Parameters<typeof usePortfolioHeartbeatCoordinator>[0]>) {
  return {
    tab: PortfolioTab.Overview,
    enabled: true,
    ...overrides,
  }
}

describe('usePortfolioHeartbeatCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
  })

  it('passes the heartbeat interval when enabled and visible', () => {
    renderHook(() => usePortfolioHeartbeatCoordinator(makeParams()))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBe(PollingInterval.KindaFast)
  })

  it('passes null delay when disabled', () => {
    renderHook(() => usePortfolioHeartbeatCoordinator(makeParams({ enabled: false })))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBeNull()
  })

  it('passes null delay when browser tab is hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })

    renderHook(() => usePortfolioHeartbeatCoordinator(makeParams()))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBeNull()
  })

  it('uses leading=false so the first tick is deferred', () => {
    renderHook(() => usePortfolioHeartbeatCoordinator(makeParams()))

    const [, , leading] = mockUseInterval.mock.calls[0]!
    expect(leading).toBe(false)
  })

  describe('Overview tab', () => {
    it('refetches balances, prices, chart, P&L, and limit orders; skips positions when poolsEnabled is false', async () => {
      renderHook(() =>
        usePortfolioHeartbeatCoordinator(makeParams({ tab: PortfolioTab.Overview, poolsEnabled: false })),
      )

      const [callback] = mockUseInterval.mock.calls[0]!
      await act(async () => {
        await callback()
      })

      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetWalletBalances] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetPortfolio] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetPortfolioChart] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetWalletTokensProfitLoss] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.ListTransactions] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledTimes(5)
    })

    it('also refetches positions when poolsEnabled', async () => {
      renderHook(() => usePortfolioHeartbeatCoordinator(makeParams({ tab: PortfolioTab.Overview, poolsEnabled: true })))

      const [callback] = mockUseInterval.mock.calls[0]!
      await act(async () => {
        await callback()
      })

      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.ListPositions] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledTimes(6)
    })
  })

  describe('Tokens tab', () => {
    it('refetches wallet balances and token profit/loss', async () => {
      renderHook(() => usePortfolioHeartbeatCoordinator(makeParams({ tab: PortfolioTab.Tokens })))

      const [callback] = mockUseInterval.mock.calls[0]!
      await act(async () => {
        await callback()
      })

      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetWalletBalances] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetPortfolio] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetWalletTokensProfitLoss] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledTimes(3)
    })
  })

  describe('Pools tab', () => {
    it('refetches wallet balances and positions when poolsEnabled', async () => {
      renderHook(() => usePortfolioHeartbeatCoordinator(makeParams({ tab: PortfolioTab.Pools, poolsEnabled: true })))

      const [callback] = mockUseInterval.mock.calls[0]!
      await act(async () => {
        await callback()
      })

      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.GetWalletBalances] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.ListPositions] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledTimes(2)
    })

    it('issues no refetches when poolsEnabled is false', async () => {
      renderHook(() => usePortfolioHeartbeatCoordinator(makeParams({ tab: PortfolioTab.Pools, poolsEnabled: false })))

      const [callback] = mockUseInterval.mock.calls[0]!
      await act(async () => {
        await callback()
      })

      expect(mockRefetchQueries).not.toHaveBeenCalled()
    })
  })

  describe('Activity tab', () => {
    it('refetches only transactions', async () => {
      renderHook(() => usePortfolioHeartbeatCoordinator(makeParams({ tab: PortfolioTab.Activity })))

      const [callback] = mockUseInterval.mock.calls[0]!
      await act(async () => {
        await callback()
      })

      expect(mockRefetchQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: [ReactQueryCacheKey.ListTransactions] }),
      )
      expect(mockRefetchQueries).toHaveBeenCalledTimes(1)
    })
  })

  describe('NFTs tab', () => {
    it('issues no refetches (NFTs self-poll)', async () => {
      renderHook(() => usePortfolioHeartbeatCoordinator(makeParams({ tab: PortfolioTab.Nfts })))

      const [callback] = mockUseInterval.mock.calls[0]!
      await act(async () => {
        await callback()
      })

      expect(mockRefetchQueries).not.toHaveBeenCalled()
    })
  })

  describe('Defi tab', () => {
    it('issues no refetches (Defi is a stub)', async () => {
      renderHook(() => usePortfolioHeartbeatCoordinator(makeParams({ tab: PortfolioTab.Defi })))

      const [callback] = mockUseInterval.mock.calls[0]!
      await act(async () => {
        await callback()
      })

      expect(mockRefetchQueries).not.toHaveBeenCalled()
    })
  })
})
