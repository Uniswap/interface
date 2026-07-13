import { renderHook, act } from '@testing-library/react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useInterval } from '~/lib/hooks/useInterval'
import { useExploreHeartbeatCoordinator } from '~/pages/Explore/hooks/useExploreHeartbeatCoordinator'
import { ExploreTab } from '~/types/explore'

const mockQueryClientRefetchQueries = vi.fn().mockResolvedValue(undefined)
const mockApolloRefetchQueries = vi.fn().mockResolvedValue(undefined)

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({ refetchQueries: mockQueryClientRefetchQueries }),
  }
})

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useApolloClient: () => ({ refetchQueries: mockApolloRefetchQueries }),
  }
})

vi.mock('~/lib/hooks/useInterval', () => ({
  useInterval: vi.fn(),
}))

const mockUseInterval = vi.mocked(useInterval)

function makeParams(overrides?: Partial<Parameters<typeof useExploreHeartbeatCoordinator>[0]>) {
  return {
    tab: ExploreTab.Tokens,
    enabled: true,
    ...overrides,
  }
}

describe('useExploreHeartbeatCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
  })

  it('passes the heartbeat interval when enabled and visible', () => {
    renderHook(() => useExploreHeartbeatCoordinator(makeParams()))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBe(PollingInterval.KindaFast)
  })

  it('passes null delay when disabled', () => {
    renderHook(() => useExploreHeartbeatCoordinator(makeParams({ enabled: false })))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBeNull()
  })

  it('passes null delay when browser tab is hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })

    renderHook(() => useExploreHeartbeatCoordinator(makeParams()))

    const [, delay] = mockUseInterval.mock.calls[0]!
    expect(delay).toBeNull()
  })

  it('uses leading=false so the first tick is deferred', () => {
    renderHook(() => useExploreHeartbeatCoordinator(makeParams()))

    const [, , leading] = mockUseInterval.mock.calls[0]!
    expect(leading).toBe(false)
  })

  it('always refetches stats, and refetches top tokens on the Tokens tab', async () => {
    renderHook(() => useExploreHeartbeatCoordinator(makeParams({ tab: ExploreTab.Tokens })))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [ReactQueryCacheKey.ExploreStatsService] }),
    )
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [ReactQueryCacheKey.TopTokens] }),
    )
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(2)
    expect(mockApolloRefetchQueries).not.toHaveBeenCalled()
  })

  it('refetches top pools on the Pools tab', async () => {
    renderHook(() => useExploreHeartbeatCoordinator(makeParams({ tab: ExploreTab.Pools })))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [ReactQueryCacheKey.DataApiService, 'listTopPools'] }),
    )
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(2)
  })

  it('refetches transactions on the Transactions tab', async () => {
    renderHook(() => useExploreHeartbeatCoordinator(makeParams({ tab: ExploreTab.Transactions })))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(mockApolloRefetchQueries).toHaveBeenCalledOnce()
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(1)
  })

  it('only refetches stats on the Toucan tab', async () => {
    renderHook(() => useExploreHeartbeatCoordinator(makeParams({ tab: ExploreTab.Toucan })))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(1)
    expect(mockApolloRefetchQueries).not.toHaveBeenCalled()
  })
})
