import { Bag } from 'components/NavBar/Bag'
import { ChainSelector } from 'components/NavBar/ChainSelector'
import { CompanyMenu } from 'components/NavBar/CompanyMenu'
import { GetTheAppButton } from 'components/NavBar/DownloadApp/GetTheAppButton'
import { PreferenceMenu } from 'components/NavBar/PreferencesMenu'
import { useTabsVisible } from 'components/NavBar/ScreenSizes'
import { SearchBar } from 'components/NavBar/SearchBar'
import { Tabs } from 'components/NavBar/Tabs/Tabs'
import Row from 'components/Row'
import Web3Status from 'components/Web3Status'
import { useScreenSize } from 'hooks/screenSize'
import { useAccount } from 'hooks/useAccount'
import { useIsLandingPage } from 'hooks/useIsLandingPage'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

const Nav = styled.nav`
  padding: 0px 12px;
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: ${Z_INDEX.sticky};
  display: flex;
  align-items: center;
  justify-content: center;
`
const NavContents = styled.div`
  max-width: ${({ theme }) => `${theme.breakpoint.xxxl}px`};
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  flex: 1 auto 1;
`
const Left = styled(Row)`
  display: flex;
  align-items: center;
  gap: 12px;
  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    gap: 8px;
  }
`
const SearchContainer = styled.div`
  display: flex;
  flex: 1;
  flex-shrink: 1;
  justify-content: center;
  align-self: center;
  align-items: flex-start;
  height: 42px;
`

export const RefreshedNavbar = () => {
  const isNftPage = useIsNftPage()
  const isLandingPage = useIsLandingPage()
  const sellPageState = useProfilePageState((state) => state.state)
  const isSmallScreen = !useScreenSize()['sm']
  const areTabsVisible = useTabsVisible()
  const collapseSearchBar = !useScreenSize()['lg']
  const account = useAccount()
  const NAV_SEARCH_MAX_HEIGHT = 'calc(100vh - 30px)'

  return (
    <Nav>
      <NavContents>
        <Left gap="12px" wrap="nowrap">
          <CompanyMenu />
          {areTabsVisible && <Tabs />}
        </Left>

        <SearchContainer data-cy="center-search-container">
          {!collapseSearchBar && <SearchBar maxHeight={NAV_SEARCH_MAX_HEIGHT} fullScreen={isSmallScreen} />}
        </SearchContainer>

        <Row gap="12px" justify="flex-end" alignSelf="flex-end">
          {collapseSearchBar && <SearchBar maxHeight={NAV_SEARCH_MAX_HEIGHT} fullScreen={isSmallScreen} />}
          {isNftPage && sellPageState !== ProfilePageStateType.LISTING && <Bag />}
          {isLandingPage && !isSmallScreen && <GetTheAppButton showIcons={false} />}
          {!account.isConnected && <PreferenceMenu />}
          {!isNftPage && <ChainSelector />}
          <Web3Status />
        </Row>
      </NavContents>
    </Nav>
  )
}
