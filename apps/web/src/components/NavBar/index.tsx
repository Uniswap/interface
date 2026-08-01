import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, styled, Nav, useMedia } from 'ui/src'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CompanyMenu } from '~/components/NavBar/CompanyMenu'
import { NewUserCTAButton } from '~/components/NavBar/DownloadApp/NewUserCTAButton'
import { PreferenceMenu } from '~/components/NavBar/PreferencesMenu'
import { useTabsVisible } from '~/components/NavBar/ScreenSizes'
import { SearchBar } from '~/components/NavBar/SearchBar'
import { useIsSearchBarVisible } from '~/components/NavBar/SearchBar/useIsSearchBarVisible'
import { Tabs } from '~/components/NavBar/Tabs/Tabs'
import { TestnetModeTooltip } from '~/components/NavBar/TestnetMode/TestnetModeTooltip'
import { Web3Status } from '~/components/Web3Status'
import { PageType, useIsPage } from '~/hooks/useIsPage'

const NavItemsRow = styled(Flex, {
  position: 'unset',
  row: true,
  minWidth: 0,
  alignItems: 'center',
  flexWrap: 'nowrap',
  justifyContent: 'flex-start',
  gap: '$spacing12',
  $md: {
    gap: '$spacing4',
  },
})

export function Navbar() {
  const isLandingPage = useIsPage(PageType.LANDING)

  const media = useMedia()
  const isSmallScreen = media.md
  const areTabsVisible = useTabsVisible()
  const isSearchBarVisible = useIsSearchBarVisible()
  const { isConnected } = useConnectionStatus()

  const { isTestnetModeEnabled } = useEnabledChains()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  return (
    <Nav
      position="unset"
      px="$padding12"
      width="100%"
      height={INTERFACE_NAV_HEIGHT}
      zIndex={zIndexes.sticky}
      justifyContent="center"
    >
      <Flex
        position="unset"
        width="100%"
        alignItems="center"
        $platform-web={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
        }}
      >
        <NavItemsRow>
          <CompanyMenu />
          {areTabsVisible && <Tabs />}
        </NavItemsRow>

        <Flex position="unset" centered>
          {isSearchBarVisible ? <SearchBar /> : null}
        </Flex>

        <NavItemsRow justifyContent="flex-end">
          {!isSearchBarVisible && <SearchBar />}
          {!isEmbeddedWalletEnabled && isLandingPage && !isSmallScreen && <NewUserCTAButton />}
          {!isConnected && <PreferenceMenu />}
          {isTestnetModeEnabled && <TestnetModeTooltip />}
          <Web3Status />
        </NavItemsRow>
      </Flex>
    </Nav>
  )
}
