import { usePortfolioTabs } from 'pages/Portfolio/Header/hooks/usePortfolioTabs'
import { type AnimationType } from 'ui/src/animations'
import { usePrevious } from 'utilities/src/react/hooks'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

export function usePortfolioTabsAnimation(pathname: string): AnimationType {
  const portfolioTabs = usePortfolioTabs()
  const currentPage = getCurrentPageFromLocation(pathname)

  // Track current and previous tab indices for animation direction
  const currentTabIndex = portfolioTabs.findIndex((tab) => currentPage === tab.pageName)
  const previousTabIndex = usePrevious(currentTabIndex)

  // Determine animation direction based on tab movement
  const getAnimationType = (): AnimationType => {
    if (previousTabIndex === undefined) {
      return 'fade' // Initial load
    }
    if (currentTabIndex > previousTabIndex) {
      return 'forward'
    }
    if (currentTabIndex < previousTabIndex) {
      return 'backward'
    }
    return 'fade'
  }

  return getAnimationType()
}
