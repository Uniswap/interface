import type { PlainMessage } from '@bufbuild/protobuf'
import { act, renderHook } from '@testing-library/react'
import { LaunchesOrderBy, LaunchWindow, type Launch } from '@uniswap/client-launches/dist/launches/v1/types_pb'
import { UniverseChainId } from '@universe/chains'
import { toLaunchItems } from '~/features/Toucan/utils/launchesModel'
import { LaunchQuickFilter, toLaunchesRequestParams, useLaunchesFilters } from '~/pages/Launches/useLaunchesList'

describe('toLaunchesRequestParams', () => {
  it('maps selected sources to launchpadIds, a selected network to chainIds, and passes the sort', () => {
    const params = toLaunchesRequestParams({
      sources: new Set(['noxa', 'flaunch']),
      networkChainId: UniverseChainId.Base,
      sortBy: LaunchesOrderBy.TVL,
      ascending: false,
      quickFilter: LaunchQuickFilter.All,
    })

    expect(params.launchpadIds).toEqual(['noxa', 'flaunch'])
    expect(params.chainIds).toEqual([UniverseChainId.Base])
    expect(params.sortBy).toBe(LaunchesOrderBy.TVL)
  })

  it('leaves launchpadIds and chainIds undefined (all) when nothing is selected', () => {
    const params = toLaunchesRequestParams({
      sources: new Set(),
      networkChainId: undefined,
      sortBy: LaunchesOrderBy.VOLUME_1D,
      ascending: false,
      quickFilter: LaunchQuickFilter.All,
    })

    expect(params.launchpadIds).toBeUndefined()
    expect(params.chainIds).toBeUndefined()
    expect(params.sortBy).toBe(LaunchesOrderBy.VOLUME_1D)
  })
})

describe('per-category default sort', () => {
  it('defaults Trending to the server TRENDING ranking, Recently launched to recency, and All to 24h volume', () => {
    const { result } = renderHook(() => useLaunchesFilters())

    expect(result.current.sortBy).toBe(LaunchesOrderBy.VOLUME_1D)

    act(() => result.current.setQuickFilter(LaunchQuickFilter.Trending))
    expect(result.current.sortBy).toBe(LaunchesOrderBy.TRENDING)
    expect(result.current.ascending).toBe(false)

    act(() => result.current.setQuickFilter(LaunchQuickFilter.RecentlyLaunched))
    expect(result.current.sortBy).toBe(LaunchesOrderBy.LAUNCHED_AT)
    expect(result.current.ascending).toBe(false)
  })

  it('leaves the All default untouched when returning from another category', () => {
    const { result } = renderHook(() => useLaunchesFilters())

    act(() => result.current.setQuickFilter(LaunchQuickFilter.RecentlyLaunched))
    act(() => result.current.setQuickFilter(LaunchQuickFilter.All))
    expect(result.current.sortBy).toBe(LaunchesOrderBy.VOLUME_1D)
  })

  it('restores the TRENDING ranking after a user re-sort when the category sort is reset', () => {
    const { result } = renderHook(() => useLaunchesFilters())

    act(() => result.current.setQuickFilter(LaunchQuickFilter.Trending))
    act(() => result.current.onSortChange(LaunchesOrderBy.TVL))
    expect(result.current.sortBy).toBe(LaunchesOrderBy.TVL)

    act(() => result.current.resetCategorySort(LaunchQuickFilter.Trending))
    expect(result.current.sortBy).toBe(LaunchesOrderBy.TRENDING)
  })
})

describe('quick-filter windows', () => {
  function windowFor(quickFilter: LaunchQuickFilter, sortBy = LaunchesOrderBy.VOLUME_1D): LaunchWindow | undefined {
    return toLaunchesRequestParams({
      sources: new Set(),
      networkChainId: undefined,
      sortBy,
      ascending: false,
      quickFilter,
    }).window
  }

  it('sends no recency window under the TRENDING sort — the server ranks on momentum regardless of launch age', () => {
    expect(windowFor(LaunchQuickFilter.Trending, LaunchesOrderBy.TRENDING)).toBeUndefined()
  })

  it('keeps the 24h window when the Trending category is re-sorted by another column', () => {
    expect(windowFor(LaunchQuickFilter.Trending, LaunchesOrderBy.VOLUME_1D)).toBe(LaunchWindow.LAST_24H)
    expect(windowFor(LaunchQuickFilter.Trending, LaunchesOrderBy.TVL)).toBe(LaunchWindow.LAST_24H)
  })

  it('leaves All unwindowed and keeps Recently launched on the 1h window', () => {
    expect(windowFor(LaunchQuickFilter.All)).toBeUndefined()
    expect(windowFor(LaunchQuickFilter.RecentlyLaunched)).toBe(LaunchWindow.LAST_1H)
  })
})

describe('Recently launched is pure recency', () => {
  const NOW_SECONDS = 1_700_000_000
  const PAGE_SIZE = 25

  function createLaunch({
    symbol,
    launchedSecondsAgo,
    volume24hUsd,
  }: {
    symbol: string
    launchedSecondsAgo: number
    volume24hUsd: number
  }): PlainMessage<Launch> {
    return {
      launchpadId: 'pons',
      token: {
        chainId: UniverseChainId.Base,
        address: `0x${symbol.padStart(40, '0')}`,
        symbol,
        name: symbol,
        logoUrl: undefined,
      },
      poolId: '0xpool',
      hooksAddress: undefined,
      launchedAt: BigInt(NOW_SECONDS - launchedSecondsAgo),
      graduated: undefined,
      stats: { sparkline: [], volume24hUsd },
      recentTrades: [],
      badges: [],
    }
  }

  /**
   * Stand-in for the ListLaunches contract: the server orders by the requested column and serves a
   * bounded page, so a launch ranked below the cut never reaches the client at all — it is ranked
   * out, not filtered out.
   */
  function servePage({ sortBy }: { sortBy: LaunchesOrderBy }): PlainMessage<Launch>[] {
    const rankOf = (launch: PlainMessage<Launch>): number =>
      sortBy === LaunchesOrderBy.LAUNCHED_AT ? Number(launch.launchedAt) : (launch.stats?.volume24hUsd ?? 0)
    return [...FEED].sort((a, b) => rankOf(b) - rankOf(a)).slice(0, PAGE_SIZE)
  }

  // A full page of launches that have already traded, plus one that landed a minute ago and has
  // not: newest of the lot, last by volume.
  const FEED: PlainMessage<Launch>[] = [
    ...Array.from({ length: 30 }, (_, index) =>
      createLaunch({ symbol: `TRADED${index}`, launchedSecondsAgo: 300 + index, volume24hUsd: 1_000 * (index + 1) }),
    ),
    createLaunch({ symbol: 'FRESH', launchedSecondsAgo: 60, volume24hUsd: 0 }),
  ]

  function itemsFor(sortBy: LaunchesOrderBy): ReturnType<typeof toLaunchItems> {
    return toLaunchItems({ launches: servePage({ sortBy }), launchpadById: new Map(), nowSeconds: NOW_SECONDS })
  }

  it('requests newest-first launch time, with no volume dimension', () => {
    const { result } = renderHook(() => useLaunchesFilters())
    act(() => result.current.setQuickFilter(LaunchQuickFilter.RecentlyLaunched))

    const params = toLaunchesRequestParams({
      sources: result.current.sources,
      networkChainId: result.current.networkChainId,
      sortBy: result.current.sortBy,
      ascending: result.current.ascending,
      quickFilter: result.current.quickFilter,
    })

    expect(params.sortBy).toBe(LaunchesOrderBy.LAUNCHED_AT)
    expect(params.ascending).toBe(false)
  })

  it('puts a just-launched token with zero volume at the top of the feed', () => {
    const items = itemsFor(LaunchesOrderBy.LAUNCHED_AT)

    expect(items[0].symbol).toBe('FRESH')
    expect(items[0].volume24hUsd).toBe(0)
  })

  it('ranks that same launch off the page under a volume sort', () => {
    // The regression this guards: VOLUME_1D never filtered untraded launches, it ranked them last,
    // and the page cut then dropped the one launch the category exists to show.
    expect(itemsFor(LaunchesOrderBy.VOLUME_1D).some((item) => item.symbol === 'FRESH')).toBe(false)
  })
})
