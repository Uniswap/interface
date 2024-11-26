import { Bag } from 'components/NavBar/Bag'
import { ChainSelector } from 'components/NavBar/ChainSelector'
import { CompanyMenu } from 'components/NavBar/CompanyMenu'
import { NewUserCTAButton } from 'components/NavBar/DownloadApp/NewUserCTAButton'
import { PreferenceMenu } from 'components/NavBar/PreferencesMenu'
import { useTabsVisible } from 'components/NavBar/ScreenSizes'
import { SearchBar } from 'components/NavBar/SearchBar'
import { Tabs } from 'components/NavBar/Tabs/Tabs'
import TestnetModeTooltip from 'components/NavBar/TestnetMode/TestnetModeTooltip'
import { useIsAccountCTAExperimentControl } from 'components/NavBar/accountCTAsExperimentUtils'
import Web3Status from 'components/Web3Status'
import Row from 'components/deprecated/Row'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useAccount } from 'hooks/useAccount'
import { useIsExplorePage } from 'hooks/useIsExplorePage'
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
import { useEnabledChains } from 'uniswap/src/features/chains/hooks'
import { INTERFACE_NAV_HEIGHT } from 'uniswap/src/theme/heights'

const Nav = styled.nav`
  padding: 0px 12px;
  width: 100%;
  height: ${INTERFACE_NAV_HEIGHT}px;
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
  align-items: center;
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

function useShouldHideChainSelector() {
  const isNftPage = useIsNftPage()
  const isLandingPage = useIsLandingPage()
  const isSendPage = useIsSendPage()
  const isSwapPage = useIsSwapPage()
  const isLimitPage = useIsLimitPage()
  const isExplorePage = useIsExplorePage()

  const baseHiddenPages = isNftPage
  const multichainHiddenPages =
    isLandingPage || isSendPage || isSwapPage || isLimitPage || baseHiddenPages || isExplorePage

  return multichainHiddenPages
}

export default function Navbar() {
  const isNftPage = useIsNftPage()
  const isLandingPage = useIsLandingPage()

  const sellPageState = useProfilePageState((state) => state.state)
  const isSmallScreen = !useScreenSize()['sm']
  const isMediumScreen = !useScreenSize()['md']
  const areTabsVisible = useTabsVisible()
  const collapseSearchBar = !useScreenSize()['lg']
  const account = useAccount()
  const NAV_SEARCH_MAX_HEIGHT = 'calc(100vh - 30px)'

  const hideChainSelector = useShouldHideChainSelector()

  const { isTestnetModeEnabled } = useEnabledChains()

  const { isControl: isSignInExperimentControl, isLoading: isSignInExperimentControlLoading } =
    useIsAccountCTAExperimentControl()

  return (
    <Nav>
      <NavContents>
        <Left>
          <CompanyMenu />
          {areTabsVisible && <Tabs />}
        </Left>

        <SearchContainer>
          {!collapseSearchBar && <SearchBar maxHeight={NAV_SEARCH_MAX_HEIGHT} fullScreen={isSmallScreen} />}
        </SearchContainer>

        <Right>
          {collapseSearchBar && <SearchBar maxHeight={NAV_SEARCH_MAX_HEIGHT} fullScreen={isSmallScreen} />}
          {isNftPage && sellPageState !== ProfilePageStateType.LISTING && <Bag />}
          {isSignInExperimentControl && !isSignInExperimentControlLoading && isLandingPage && !isSmallScreen && (
            <NewUserCTAButton />
          )}
          {!account.isConnected && !account.isConnecting && <PreferenceMenu />}
          {!hideChainSelector && <ChainSelector />}
          {isTestnetModeEnabled && <TestnetModeTooltip />}
          <Web3Status />
          {!isSignInExperimentControl && !isSignInExperimentControlLoading && !account.address && !isMediumScreen && (
            <NewUserCTAButton />
          )}
        </Right>
      </NavContents>
    </Nav>
  )
}
