import Navbar from 'components/NavBar/index'
import { MobileAppPromoBanner, useMobileAppPromoBannerEligible } from 'components/TopLevelBanners/MobileAppPromoBanner'
import { UkBanner, useRenderUkBanner } from 'components/TopLevelBanners/UkBanner'
import { useScroll } from 'hooks/useScroll'
import { GRID_AREAS } from 'pages/App/utils/shared'
import { memo } from 'react'
import { Flex } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

export const Header = memo(function Header() {
  const { isScrolledDown } = useScroll()
  const isHeaderTransparent = !isScrolledDown
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
      </Flex>
      <Flex
        width="100%"
        backgroundColor={isHeaderTransparent ? 'transparent' : '$surface1'}
        borderBottomColor={isHeaderTransparent ? 'transparent' : '$surface3'}
        borderBottomWidth={1}
        pointerEvents="auto"
      >
        <Navbar />
      </Flex>
    </Flex>
  )
})
