import type { Query } from '@tanstack/react-query'
import { renderHook, act } from '@testing-library/react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { GET_PROTOCOL_STATS_QUERY_KEY_PREFIX } from 'uniswap/src/data/apiClients/dataApiService/explore/useGetProtocolStatsQuery'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useInterval } from '~/lib/hooks/useInterval'
import {
  isShallowInfiniteQuery,
  useExploreHeartbeatCoordinator,
} from '~/pages/Explore/hooks/useExploreHeartbeatCoordinator'
import { ExploreTab } from '~/types/explore'

const mockQueryClientRefetchQueries = vi.fn().mockResolvedValue(undefined)

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({ refetchQueries: mockQueryClientRefetchQueries }),
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
    expect(delay).toBe(PollingInterval.Normal)
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
      expect.objectContaining({ queryKey: [...GET_PROTOCOL_STATS_QUERY_KEY_PREFIX] }),
    )
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: [ReactQueryCacheKey.TopTokens], predicate: isShallowInfiniteQuery }),
      { cancelRefetch: false },
    )
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(2)
  })

  it('refetches top pools on the Pools tab without cancelling in-flight fetches', async () => {
    renderHook(() => useExploreHeartbeatCoordinator(makeParams({ tab: ExploreTab.Pools })))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [ReactQueryCacheKey.DataApiService, 'listPools'],
        predicate: isShallowInfiniteQuery,
      }),
      { cancelRefetch: false },
    )
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(2)
  })

  describe('isShallowInfiniteQuery', () => {
    function makeQuery(data: unknown): Query {
      return { state: { data } } as Query
    }

    it('excludes deeply-paginated infinite queries from heartbeat refetches', () => {
      expect(isShallowInfiniteQuery(makeQuery({ pages: new Array(6), pageParams: new Array(6) }))).toBe(false)
    })

    it('includes shallow infinite queries', () => {
      expect(isShallowInfiniteQuery(makeQuery({ pages: new Array(5), pageParams: new Array(5) }))).toBe(true)
      expect(isShallowInfiniteQuery(makeQuery({ pages: [], pageParams: [] }))).toBe(true)
    })

    it('includes queries with no data yet', () => {
      expect(isShallowInfiniteQuery(makeQuery(undefined))).toBe(true)
    })
  })

  it('refetches transactions on the Transactions tab without cancelling in-flight fetches', async () => {
    renderHook(() => useExploreHeartbeatCoordinator(makeParams({ tab: ExploreTab.Transactions })))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [ReactQueryCacheKey.DataApiService, 'listTransactions'],
        predicate: isShallowInfiniteQuery,
      }),
      { cancelRefetch: false },
    )
    // Stats + listTransactions only: the tab has a single data source, so a second transactions
    // refetch here would mean a stale one survived alongside it.
    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(2)
  })

  it('only refetches stats on the Toucan tab', async () => {
    renderHook(() => useExploreHeartbeatCoordinator(makeParams({ tab: ExploreTab.Toucan })))

    const [callback] = mockUseInterval.mock.calls[0]!
    await act(async () => {
      await callback()
    })

    expect(mockQueryClientRefetchQueries).toHaveBeenCalledTimes(1)
  })
})
