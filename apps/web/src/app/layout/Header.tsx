import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { memo } from 'react'
import { useLocation } from 'react-router'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { GRID_AREAS } from '~/app/layout/gridAreas'
import { Navbar } from '~/components/NavBar/index'
import {
  MobileAppPromoBanner,
  useMobileAppPromoBannerEligible,
} from '~/components/TopLevelBanners/MobileAppPromoBanner'
import { UkBanner, useRenderUkBanner } from '~/components/TopLevelBanners/UkBanner'
import { PageType, useIsPage } from '~/hooks/useIsPage'
import { useScroll } from '~/hooks/useScroll'

export const Header = memo(function Header() {
  const { isScrolledDown } = useScroll()
  const isPortfolioPage = useIsPage(PageType.PORTFOLIO)
  const isExplorePage = useIsPage(PageType.EXPLORE)
  const location = useLocation()
  const media = useMedia()
  const isMarginEnabled = useFeatureFlag(FeatureFlags.Margin)
  // Full-bleed margin terminal scrolls under the fixed nav — keep the nav opaque over it
  // (mirrors SwapPage's isTerminalRoute).
  const isMarginTerminalRoute = isMarginEnabled && location.pathname === '/margin' && !media.xl
  const isHeaderTransparent = !isScrolledDown && !isPortfolioPage && !isExplorePage && !isMarginTerminalRoute
  const navHasBottomBorder = isScrolledDown
  const renderUkBanner = useRenderUkBanner()
  const extensionEligible = useMobileAppPromoBannerEligible()

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
