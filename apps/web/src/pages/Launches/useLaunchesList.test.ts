import { act, renderHook } from '@testing-library/react'
import { LaunchesOrderBy, LaunchWindow } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
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
  it('defaults the Trending category to the server TRENDING ranking, and other categories to 24h volume', () => {
    const { result } = renderHook(() => useLaunchesFilters())

    expect(result.current.sortBy).toBe(LaunchesOrderBy.VOLUME_1D)

    act(() => result.current.setQuickFilter(LaunchQuickFilter.Trending))
    expect(result.current.sortBy).toBe(LaunchesOrderBy.TRENDING)
    expect(result.current.ascending).toBe(false)

    act(() => result.current.setQuickFilter(LaunchQuickFilter.RecentlyLaunched))
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
