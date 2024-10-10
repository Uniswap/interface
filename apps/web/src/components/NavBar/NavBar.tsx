import { CompanyMenu } from "components/NavBar/CompanyMenu";
import { useTabsVisible } from "components/NavBar/ScreenSizes";
import { Tabs } from "components/NavBar/Tabs/Tabs";
import Row from "components/Row";
import Web3Status from "components/Web3Status";
import { useAccount } from "hooks/useAccount";
import { useIsNftPage } from "hooks/useIsNftPage";
import styled from "styled-components";
import { BREAKPOINTS } from "theme";
import { Z_INDEX } from "theme/zIndex";
import { ChainSelector } from "./ChainSelector";
import { PreferenceMenu } from "./PreferencesMenu";

const Nav = styled.nav`
  padding: 0px 12px;
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: ${Z_INDEX.sticky};
  display: flex;
  align-items: center;
  justify-content: center;
`;
const NavContents = styled.div`
  max-width: ${({ theme }) => `${theme.breakpoint.xxxl}px`};
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  flex: 1 auto 1;
`;
const Left = styled(Row)`
  display: flex;
  align-items: center;
  gap: 12px;
  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    gap: 8px;
  }
`;

export const RefreshedNavbar = () => {
  const isNftPage = useIsNftPage();
  const areTabsVisible = useTabsVisible();
  const account = useAccount();

  return (
    <Nav>
      <NavContents>
        <Left gap="12px" wrap="nowrap">
          <CompanyMenu />
          {areTabsVisible && <Tabs />}
        </Left>

        <Row gap="12px" justify="flex-end" alignSelf="flex-end">
          {!account.isConnected && <PreferenceMenu />}
          {!isNftPage && <ChainSelector />}
          <Web3Status />
        </Row>
      </NavContents>
    </Nav>
  );
};
