import { memo, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { isPortfolioTab } from '~/pages/Portfolio/types'
import { getCurrentPageFromLocation } from '~/utils/urlRoutes'

/**
 * Every Portfolio tab is its own `InterfacePageName`, but switching tabs is an
 * intra-page URL change: the tabs share one scroll position and one animated
 * sticky header, so a reset mid-transition yanks the page under the running
 * animation. A newly added Portfolio tab page name must be added here, or its
 * tab switches reintroduce the scroll reset.
 */
const PORTFOLIO_PAGES = new Set<InterfacePageName>([
  InterfacePageName.PortfolioPage,
  InterfacePageName.PortfolioOverviewPage,
  InterfacePageName.PortfolioTokensPage,
  InterfacePageName.PortfolioPoolsPage,
  InterfacePageName.PortfolioDefiPage,
  InterfacePageName.PortfolioNftsPage,
  InterfacePageName.PortfolioActivityPage,
])

// Portfolio scroll keys are the portfolio base path with any trailing tab slug
// stripped: `/portfolio` and `/portfolio/tokens` share one key (tab switches
// keep scroll), while `/portfolio/<address>[/tab]` keys per wallet address, so
// landing on another wallet's portfolio still resets scroll.
function getPortfolioScrollKey(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (isPortfolioTab(segments[segments.length - 1])) {
    segments.pop()
  }
  return `/${segments.join('/')}`
}

// Details pages keep one page name across many URLs, so they key on the full pathname: navigating to a
// different token or category (e.g. via Related Tokens or a row category tag) must still reset scroll.
const DETAILS_PAGES = new Set<InterfacePageName>([
  InterfacePageName.TokenDetailsPage,
  InterfacePageName.CategoryDetailsPage,
])

// All other pages key on currentPage to avoid resetting scroll on intra-page URL changes.
function getScrollKey({ currentPage, pathname }: { currentPage?: InterfacePageName; pathname: string }): string {
  if (currentPage !== undefined && DETAILS_PAGES.has(currentPage)) {
    return pathname
  }
  if (currentPage !== undefined && PORTFOLIO_PAGES.has(currentPage)) {
    return getPortfolioScrollKey(pathname)
  }
  return String(currentPage)
}

export const ResetPageScrollEffect = memo(function ResetPageScrollEffect() {
  const location = useLocation()
  const { pathname } = location
  const currentPage = getCurrentPageFromLocation(pathname)
  const [hasChangedOnce, setHasChangedOnce] = useState(false)

  const scrollKey = getScrollKey({ currentPage, pathname })

  useEffect(() => {
    if (!hasChangedOnce) {
      // avoid setting scroll to top on initial load
      setHasChangedOnce(true)
    } else {
      window.scrollTo(0, 0)
    }
    // we don't want this to re-run on change of hasChangedOnce! or else it defeats the point of the fix
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [scrollKey])

  return null
})
