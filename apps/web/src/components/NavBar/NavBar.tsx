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
import { useIsLimitPage } from 'hooks/useIsLimitPage'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsSendPage } from 'hooks/useIsSendPage'
import { useIsSwapPage } from 'hooks/useIsSwapPage'
import styled, { css } from 'lib/styled-components'
import { useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

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
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  flex: 1 auto 1;
`
const NavItems = css`
  gap: 12px;
  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    gap: 4px;
  }
`
const Left = styled(Row)`
  display: flex;
  align-items: center;
  wrap: nowrap;
  ${NavItems}
`
const Right = styled(Row)`
  justify-content: flex-end;
  align-self: flex-end;
  ${NavItems}
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
  const isSendPage = useIsSendPage()
  const isSwapPage = useIsSwapPage()
  const isLimitPage = useIsLimitPage()

  const sellPageState = useProfilePageState((state) => state.state)
  const isSmallScreen = !useScreenSize()['sm']
  const areTabsVisible = useTabsVisible()
  const collapseSearchBar = !useScreenSize()['lg']
  const account = useAccount()
  const NAV_SEARCH_MAX_HEIGHT = 'calc(100vh - 30px)'

  const multichainUXEnabled = useFeatureFlag(FeatureFlags.MultichainUX)
  const hideChainSelector = multichainUXEnabled ? isSendPage || isSwapPage || isLimitPage || isNftPage : isNftPage

  return (
    <Nav>
      <NavContents>
        <Left>
          <CompanyMenu />
          {areTabsVisible && <Tabs />}
        </Left>

        <SearchContainer data-cy="center-search-container">
          {!collapseSearchBar && <SearchBar maxHeight={NAV_SEARCH_MAX_HEIGHT} fullScreen={isSmallScreen} />}
        </SearchContainer>

        <Right>
          {collapseSearchBar && <SearchBar maxHeight={NAV_SEARCH_MAX_HEIGHT} fullScreen={isSmallScreen} />}
          {isNftPage && sellPageState !== ProfilePageStateType.LISTING && <Bag />}
          {isLandingPage && !isSmallScreen && <GetTheAppButton showIcons={false} />}
          {!account.isConnected && !account.isConnecting && <PreferenceMenu />}
          {!hideChainSelector && <ChainSelector />}
          <Web3Status />
        </Right>
      </NavContents>
    </Nav>
  )
}
