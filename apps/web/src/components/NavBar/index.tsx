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
import { useAccount } from 'hooks/useAccount'
import { PageType, useIsPage } from 'hooks/useIsPage'
import styled, { css } from 'lib/styled-components'
import { useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { Z_INDEX } from 'theme/zIndex'
import { useMedia } from 'ui/src'
import { INTERFACE_NAV_HEIGHT, breakpoints } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

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
  @media screen and (max-width: ${breakpoints.md}px) {
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
  const isNFTPage = useIsPage(PageType.NFTS)
  const isLandingPage = useIsPage(PageType.LANDING)
  const isSendPage = useIsPage(PageType.SEND)
  const isSwapPage = useIsPage(PageType.SWAP)
  const isLimitPage = useIsPage(PageType.LIMIT)
  const isExplorePage = useIsPage(PageType.EXPLORE)
  const isPositionsPage = useIsPage(PageType.POSITIONS)
  const isMigrateV3Page = useIsPage(PageType.MIGRATE_V3)
  const isBuyPage = useIsPage(PageType.BUY)

  const baseHiddenPages = isNFTPage
  const multichainHiddenPages =
    isLandingPage ||
    isSendPage ||
    isSwapPage ||
    isLimitPage ||
    baseHiddenPages ||
    isExplorePage ||
    isPositionsPage ||
    isMigrateV3Page ||
    isBuyPage

  return multichainHiddenPages
}

export default function Navbar() {
  const isNFTPage = useIsPage(PageType.NFTS)
  const isLandingPage = useIsPage(PageType.LANDING)

  const sellPageState = useProfilePageState((state) => state.state)
  const media = useMedia()
  const isSmallScreen = media.md
  const isMediumScreen = media.lg
  const areTabsVisible = useTabsVisible()
  const collapseSearchBar = media.xl
  const account = useAccount()
  const NAV_SEARCH_MAX_HEIGHT = 'calc(100vh - 30px)'

  const hideChainSelector = useShouldHideChainSelector()

  const { isTestnetModeEnabled } = useEnabledChains()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  const { isControl, isLoading: isSignInExperimentControlLoading } = useIsAccountCTAExperimentControl()

  const isSignInExperimentControl = !isEmbeddedWalletEnabled && isControl

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
          {isNFTPage && sellPageState !== ProfilePageStateType.LISTING && <Bag />}
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
