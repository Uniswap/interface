import Navbar from 'components/NavBar/index'
import { MobileAppPromoBanner, useMobileAppPromoBannerEligible } from 'components/TopLevelBanners/MobileAppPromoBanner'
import { UkBanner, useRenderUkBanner } from 'components/TopLevelBanners/UkBanner'
import { ScrollDirection, useScroll } from 'hooks/useScroll'
import styled from 'lib/styled-components'
import { useBag } from 'nft/hooks'
import { GRID_AREAS } from 'pages/App/utils/shared'
import { memo } from 'react'
import { useLocation } from 'react-router-dom'
import { Z_INDEX } from 'theme/zIndex'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const AppHeader = styled.div`
  grid-area: ${GRID_AREAS.HEADER};
  width: 100vw;
  position: -webkit-sticky;
  position: sticky;
  top: 0px;
  z-index: ${Z_INDEX.sticky};
`
const Banners = styled.div`
  position: relative;
  z-index: ${Z_INDEX.sticky};
`
const NavOnScroll = styled.div<{ $hide: boolean; $transparent?: boolean }>`
  width: 100%;
  transition: transform ${({ theme }) => theme.transition.duration.slow};
  background-color: ${({ theme, $transparent }) => !$transparent && theme.surface1};
  border-bottom: ${({ theme, $transparent }) => !$transparent && `1px solid ${theme.surface3}`};
  ${({ $hide, theme }) => $hide && `transform: translateY(-${theme.navHeight}px);`}
`

export const Header = memo(function Header() {
  const { isScrolledDown, direction: scrollDirection } = useScroll()
  const { pathname } = useLocation()
  const isExplorePage = pathname.startsWith('/explore')
  const isBagExpanded = useBag((state) => state.bagExpanded)
  const isHeaderTransparent = !isScrolledDown && !isBagExpanded
  const renderUkBanner = useRenderUkBanner()
  const extensionEligible = useMobileAppPromoBannerEligible()
  const isLegacyNav = !useFeatureFlag(FeatureFlags.NavRefresh)

  return (
    <AppHeader id="AppHeader">
      <Banners>
        {extensionEligible && <MobileAppPromoBanner />}
        {renderUkBanner && <UkBanner />}
      </Banners>
      <NavOnScroll
        $hide={!isExplorePage && !isLegacyNav && scrollDirection === ScrollDirection.DOWN}
        $transparent={isHeaderTransparent}
      >
        <Navbar blur={isHeaderTransparent} />
      </NavOnScroll>
    </AppHeader>
  )
})
