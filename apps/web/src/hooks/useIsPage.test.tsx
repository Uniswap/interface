import { renderHook } from '@testing-library/react'
import { MatchType, PageType, useIsPage } from 'hooks/useIsPage'
import { BrowserRouter } from 'react-router-dom'

describe('useIsPage', () => {
  it.each([
    [PageType.BUY, '/buy'],
    [PageType.EXPLORE, '/explore/details'],
    [PageType.LANDING, '/'],
    [PageType.LIMIT, '/limit'],
    [PageType.MIGRATE_V3, '/migrate/v3/info'],
    [PageType.NFTS, '/nfts/asset/123'],
    [PageType.SEND, '/path/to/send'],
  ])('matches default behavior for %s based on path %s', (pageType, path) => {
    window.history.pushState({}, '', path)
    const { result } = renderHook(() => useIsPage(pageType), {
      wrapper: BrowserRouter,
    })
    expect(result.current).toBe(true)
  })

  it.each([
    [PageType.SWAP, '/swap/details', MatchType.STARTS_WITH],
    [PageType.POSITIONS, '/view/positions', MatchType.INCLUDES],
    [PageType.SEND, '/send', MatchType.EXACT],
  ])('overrides default MatchType for %s when custom MatchType %s is provided', (pageType, path, matchType) => {
    window.history.pushState({}, '', path)
    const { result } = renderHook(() => useIsPage(pageType, matchType), {
      wrapper: BrowserRouter,
    })
    expect(result.current).toBe(true)
  })

  it.each([
    [PageType.NFTS, '/wrong/path/nfts'],
    [PageType.SWAP, '/different/swap/location'],
    [PageType.POSITIONS, '/incorrect/position'],
  ])('does not match default behavior for %s with path %s', (pageType, path) => {
    window.history.pushState({}, '', path)
    const { result } = renderHook(() => useIsPage(pageType), {
      wrapper: BrowserRouter,
    })
    expect(result.current).toBe(false)
  })
})
