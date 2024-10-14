import Navbar from "components/NavBar/index";
import {
  MobileAppPromoBanner,
  useMobileAppPromoBannerEligible,
} from "components/TopLevelBanners/MobileAppPromoBanner";
import {
  UkBanner,
  useRenderUkBanner,
} from "components/TopLevelBanners/UkBanner";
import { useScroll } from "hooks/useScroll";
import { useBag } from "nft/hooks";
import { GRID_AREAS } from "pages/App/utils/shared";
import { memo } from "react";
import styled from "styled-components";
import { Z_INDEX } from "theme/zIndex";

const AppHeader = styled.div`
  grid-area: ${GRID_AREAS.HEADER};
  width: 100vw;
  position: -webkit-sticky;
  position: sticky;
  top: 0px;
  z-index: ${Z_INDEX.sticky};
`;
const Banners = styled.div`
  position: relative;
  z-index: ${Z_INDEX.sticky};
`;
const NavOnScroll = styled.div<{ transparent?: boolean }>`
  width: 100%;
  transition: transform 0.5s;
  background-color: ${({ theme, transparent }) =>
    !transparent && theme.surface1};
  border-bottom: ${({ theme, transparent }) =>
    !transparent && `1px solid ${theme.surface3}`};
`;

export const Header = memo(function Header() {
  const { isScrolledDown } = useScroll();
  const isBagExpanded = useBag((state) => state.bagExpanded);
  const isHeaderTransparent = !isScrolledDown && !isBagExpanded;
  const renderUkBanner = useRenderUkBanner();
  // const extensionEligible = useMobileAppPromoBannerEligible();

  return (
    <AppHeader>
      <Banners>
        {/* {extensionEligible && <MobileAppPromoBanner />} */}
        {renderUkBanner && <UkBanner />}
      </Banners>
      <NavOnScroll transparent={isHeaderTransparent}>
        <Navbar blur={isHeaderTransparent} />
      </NavOnScroll>
    </AppHeader>
  );
});
