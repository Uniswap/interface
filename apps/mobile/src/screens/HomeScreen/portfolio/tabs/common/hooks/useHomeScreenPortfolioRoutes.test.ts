import { useHomeScreenPortfolioRoutes } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useHomeScreenPortfolioRoutes'
import { HOME_TAB_SECTION_NAME, HomeTab, type HomeRoute } from 'src/screens/HomeScreen/portfolio/types'
import { renderHook } from 'src/test/test-utils'
import { SectionName } from 'uniswap/src/features/telemetry/constants'

const renderRoutes = (showEmptyWalletState: boolean, shouldShowPoolsTab: boolean): HomeRoute[] => {
  const { result } = renderHook(() => useHomeScreenPortfolioRoutes(showEmptyWalletState, shouldShowPoolsTab))
  return result.current
}

const routeKeys = (showEmptyWalletState: boolean, shouldShowPoolsTab: boolean): HomeTab[] =>
  renderRoutes(showEmptyWalletState, shouldShowPoolsTab).map((route) => route.key)

describe('useHomeScreenPortfolioRoutes', () => {
  describe('tab visibility', () => {
    it('shows the Pools tab between Tokens and NFTs when the wallet has pools', () => {
      expect(routeKeys(false, true)).toEqual([HomeTab.Tokens, HomeTab.Pools, HomeTab.NFTs])
    })

    it('omits the Pools tab when the wallet has no pools', () => {
      expect(routeKeys(false, false)).toEqual([HomeTab.Tokens, HomeTab.NFTs])
    })

    it('shows the Pools tab even when there are no tokens (pools-only wallet bypasses the empty state)', () => {
      // A pools-only wallet resolves `showEmptyWalletState` to false, so routes still build the tabs.
      expect(routeKeys(false, true)).toContain(HomeTab.Pools)
    })

    it('shows only the Explore tab for an empty wallet', () => {
      expect(routeKeys(true, false)).toEqual([HomeTab.Explore])
    })

    it('shows only the Explore tab for an empty wallet even if pools would otherwise be visible', () => {
      // Empty-wallet state takes precedence over the pools flag.
      expect(routeKeys(true, true)).toEqual([HomeTab.Explore])
    })
  })

  describe('route shape', () => {
    it('gives every route a non-empty title and a unique key', () => {
      const routes = renderRoutes(false, true)
      expect(routes.every((route) => route.title.length > 0)).toBe(true)
      expect(new Set(routes.map((route) => route.key)).size).toBe(routes.length)
    })

    it('renders the Explore tab with the secondary text style', () => {
      const [exploreRoute] = renderRoutes(true, false)
      expect(exploreRoute?.textStyleType).toBe('secondary')
    })

    it('leaves the funded-wallet tabs with the default text style', () => {
      const routes = renderRoutes(false, true)
      expect(routes.every((route) => route.textStyleType === undefined)).toBe(true)
    })
  })

  it('maps each tab identity to its telemetry section name', () => {
    expect(HOME_TAB_SECTION_NAME[HomeTab.Tokens]).toBe(SectionName.HomeTokensTab)
    expect(HOME_TAB_SECTION_NAME[HomeTab.Pools]).toBe(SectionName.HomePoolsTab)
    expect(HOME_TAB_SECTION_NAME[HomeTab.NFTs]).toBe(SectionName.HomeNFTsTab)
    expect(HOME_TAB_SECTION_NAME[HomeTab.Explore]).toBe(SectionName.HomeExploreTab)
  })

  it('returns a stable reference across re-renders with unchanged inputs', () => {
    const { result, rerender } = renderHook(() => useHomeScreenPortfolioRoutes(false, true))
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
