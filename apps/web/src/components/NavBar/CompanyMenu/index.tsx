import { useIsTouchDevice } from "@tamagui/core";
import { ArrowChangeDown } from "components/Icons/ArrowChangeDown";
import { NavIcon } from "components/Logo/NavIcon";
import { MenuDropdown } from "components/NavBar/CompanyMenu/MenuDropdown";
import { MobileMenuDrawer } from "components/NavBar/CompanyMenu/MobileMenuDrawer";
import { useIsMobileDrawer } from "components/NavBar/ScreenSizes";
import { useScreenSize } from "hooks/screenSize";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Popover, Text } from "ui/src";
import { Hamburger } from "ui/src/components/icons";

const ArrowDown = styled(ArrowChangeDown)`
  height: 100%;
  color: ${({ theme }) => theme.neutral2};
`;
const UniIconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  cursor: pointer;
  &:hover {
    ${ArrowDown} {
      color: ${({ theme }) => theme.neutral1} !important;
    }
  }
`;

export function CompanyMenu() {
  const popoverRef = useRef<Popover>(null);
  const isSmallScreen = !useScreenSize()["sm"];
  const isMobileDrawer = useIsMobileDrawer();
  const isLargeScreen = useScreenSize()["xl"];
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = useCallback(() => {
    popoverRef.current?.close();
  }, [popoverRef]);
  useEffect(() => closeMenu(), [location, closeMenu]);

  const handleLogoClick = useCallback(() => {
    navigate({
      pathname: "/",
      search: "?intro=true",
    });
  }, [navigate]);
  const isTouchDevice = useIsTouchDevice();

  return (
    <Popover
      ref={popoverRef}
      placement="bottom"
      hoverable
      stayInFrame
      allowFlip
      onOpenChange={setIsOpen}
    >
      <Popover.Trigger>
        <UniIconContainer>
          <NavIcon
            width="48"
            height="48"
            data-testid="taraswap-logo"
            clickable
            onClick={handleLogoClick}
          />
          {isLargeScreen && (
            <Text variant="subheading1" userSelect="none">
              Taraswap
            </Text>
          )}
          {(isSmallScreen || isTouchDevice) && (
            <Hamburger size={22} color="$neutral2" cursor="pointer" ml="16px" />
          )}
          <ArrowDown width="12px" height="12px" />
        </UniIconContainer>
      </Popover.Trigger>
      {isMobileDrawer ? (
        <MobileMenuDrawer isOpen={isOpen} closeMenu={closeMenu} />
      ) : (
        <MenuDropdown close={closeMenu} />
      )}
    </Popover>
  );
}
