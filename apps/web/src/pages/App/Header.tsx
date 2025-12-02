import Navbar from 'components/NavBar/index'
import { MobileAppPromoBanner, useMobileAppPromoBannerEligible } from 'components/TopLevelBanners/MobileAppPromoBanner'
import { UkBanner, useRenderUkBanner } from 'components/TopLevelBanners/UkBanner'
import { useRenderUniswapWrapped2025Banner } from 'components/TopLevelBanners/UniswapWrapped2025Banner'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { useScroll } from 'hooks/useScroll'
import { GRID_AREAS } from 'pages/App/utils/shared'
import { memo } from 'react'
import { Flex } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

export const Header = memo(function Header() {
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
      zIndex={zIndexes.header}
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
