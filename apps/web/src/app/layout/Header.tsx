import { memo } from 'react'
import { useLocation } from 'react-router'
import { Flex } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { GRID_AREAS } from '~/app/layout/gridAreas'
import { Navbar } from '~/components/NavBar/index'
import {
  MobileAppPromoBanner,
  useMobileAppPromoBannerEligible,
} from '~/components/TopLevelBanners/MobileAppPromoBanner'
import { UkBanner, useRenderUkBanner } from '~/components/TopLevelBanners/UkBanner'
import { useRenderUniswapWrapped2025Banner } from '~/components/TopLevelBanners/UniswapWrapped2025Banner'
import { PageType, useIsPage } from '~/hooks/useIsPage'
import { useScroll } from '~/hooks/useScroll'

/** Routes that render inside TerminalChrome (which has its own TopNav) — hide the legacy header. */
const TERMINAL_ROUTES = [
  '/swap', '/markets', '/pools', '/positions', '/locker', '/multisender', '/token/new',
  '/vesting', '/farms', '/airdrop', '/launch', '/portfolio', '/activity', '/analytics',
  '/leaderboard', '/referrals', '/settings', '/widget', '/terminal',
]

export const Header = memo(function Header() {
  const { pathname } = useLocation()
  // Terminal pages have their own TopNav — don't render the legacy header on top of it.
  const isTerminalRoute = pathname === '/' || TERMINAL_ROUTES.some((r) => pathname.startsWith(r))
  if (isTerminalRoute) {
    return null
  }
  const { isScrolledDown } = useScroll()
  const isPortfolioPage = useIsPage(PageType.PORTFOLIO)
  const isExplorePage = useIsPage(PageType.EXPLORE)
  const isHeaderTransparent = !isScrolledDown && !isPortfolioPage && !isExplorePage
  const navHasBottomBorder = isScrolledDown
  const renderUkBanner = useRenderUkBanner()
  const extensionEligible = useMobileAppPromoBannerEligible()
  const renderUniswapWrapped2025Banner = useRenderUniswapWrapped2025Banner()

  return (
    <Flex
      id="AppHeader"
      $platform-web={{
        gridArea: GRID_AREAS.HEADER,
        position: 'sticky',
      }}
      className="webkitSticky"
      width="100vw"
      top={0}
      // fixed (1030) > sticky (1020) so nav wins DOM-order stacking tiebreak
      zIndex={zIndexes.fixed}
      pointerEvents="none"
    >
      <style>
        {`
          .webkitSticky {
            position: -webkit-sticky;
          }
        `}
      </style>
      <Flex position="relative" zIndex={zIndexes.sticky} pointerEvents="auto">
        {extensionEligible && <MobileAppPromoBanner />}
        {renderUkBanner && <UkBanner />}
        {renderUniswapWrapped2025Banner}
      </Flex>
      <Flex
        width="100%"
        backgroundColor={isHeaderTransparent ? 'transparent' : '$surface1'}
        borderBottomColor={navHasBottomBorder ? '$surface3' : 'transparent'}
        borderBottomWidth={1}
        pointerEvents="auto"
        transition="border-bottom-color 0.2s ease-in-out"
      >
        <Navbar />
      </Flex>
    </Flex>
  )
})
