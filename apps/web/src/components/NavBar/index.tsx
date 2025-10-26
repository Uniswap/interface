import Row from 'components/deprecated/Row'
import { CompanyMenu } from 'components/NavBar/CompanyMenu'
import { NewUserCTAButton } from 'components/NavBar/DownloadApp/NewUserCTAButton'
import { PreferenceMenu } from 'components/NavBar/PreferencesMenu'
import { useTabsVisible } from 'components/NavBar/ScreenSizes'
import { SearchBar } from 'components/NavBar/SearchBar'
import { useIsSearchBarVisible } from 'components/NavBar/SearchBar/useIsSearchBarVisible'
import { Tabs } from 'components/NavBar/Tabs/Tabs'
import TestnetModeTooltip from 'components/NavBar/TestnetMode/TestnetModeTooltip'
import Web3Status from 'components/Web3Status'
import { PageType, useIsPage } from 'hooks/useIsPage'
import deprecatedStyled, { css } from 'lib/styled-components'
import { Flex, styled, Nav as TamaguiNav, useMedia } from 'ui/src'
import { breakpoints, INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

// Flex is position relative by default, we must unset the position on every Flex
// between the body and search component
const UnpositionedFlex = styled(Flex, {
  position: 'unset',
})
const Nav = styled(TamaguiNav, {
  position: 'unset',
  px: '$padding12',
  width: '100%',
  height: INTERFACE_NAV_HEIGHT,
  zIndex: zIndexes.sticky,
  justifyContent: 'center',
})
const NavItems = css`
  gap: 12px;
  @media screen and (max-width: ${breakpoints.md}px) {
    gap: 4px;
  }
`
const Left = deprecatedStyled(Row)`
  display: flex;
  align-items: center;
  wrap: nowrap;
  ${NavItems}
`
const Right = deprecatedStyled(Row)`
  justify-content: flex-end;
  ${NavItems}
`

export default function Navbar() {
  const isLandingPage = useIsPage(PageType.LANDING)

  const media = useMedia()
  const isSmallScreen = media.md
  const areTabsVisible = useTabsVisible()
  const isSearchBarVisible = useIsSearchBarVisible()
  const { isConnected } = useConnectionStatus()

  const { isTestnetModeEnabled } = useEnabledChains()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  return (
    <Nav>
      <UnpositionedFlex row centered width="100%">
        <Left>
          <CompanyMenu />
          {areTabsVisible && <Tabs />}
        </Left>

        {isSearchBarVisible && <SearchBar />}

        <Right>
          {!isSearchBarVisible && <SearchBar />}
          {!isEmbeddedWalletEnabled && isLandingPage && !isSmallScreen && <NewUserCTAButton />}
          {!isConnected && <PreferenceMenu />}
          {isTestnetModeEnabled && <TestnetModeTooltip />}
          {isEmbeddedWalletEnabled && !isConnected && <NewUserCTAButton />}
          <Web3Status />
        </Right>
      </UnpositionedFlex>
    </Nav>
  )
}
