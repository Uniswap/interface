import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, type FlexCompatProps } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { forwardRef } from 'react'
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

const NavItemsRow = forwardRef<HTMLDivElement, FlexCompatProps>(function NavItemsRow({ $md: md, ...props }, ref) {
  return (
    <Flex
      ref={ref}
      position="static"
      row
      minWidth={0}
      alignItems="center"
      flexWrap="nowrap"
      justifyContent="flex-start"
      gap="$spacing12"
      $md={{ gap: '$spacing2', ...md }}
      {...props}
    />
  )
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
  // On mobile the right-row glyphs sit 20px apart, spaced per item instead of by the row gap. The testnet
  // pill doesn't follow that rhythm, so with it shown the row keeps the default gap.
  const isCompactMobileRow = !isTestnetModeEnabled

  return (
    <Flex
      tag="nav"
      position="unset"
      px="$padding12"
      $md={{ px: '$padding16' }}
      width="100%"
      height={INTERFACE_NAV_HEIGHT}
      zIndex={zIndexes.sticky}
      justifyContent="center"
    >
      <Flex
        position="static"
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

        <Flex position="static" centered>
          {isSearchBarVisible ? <SearchBar /> : null}
        </Flex>

        <NavItemsRow justifyContent="flex-end" $md={isCompactMobileRow ? { gap: '$none' } : undefined}>
          {!isSearchBarVisible && <SearchBar />}
          {!isEmbeddedWalletEnabled && isLandingPage && !isSmallScreen && <NewUserCTAButton />}
          {!isConnected && (
            // NavIcon pads its glyph 14px per side, so the menu overlaps search's tap box to land 20px from it.
            <Flex $md={isCompactMobileRow ? { ml: -8, mr: '$spacing6' } : undefined}>
              <PreferenceMenu />
            </Flex>
          )}
          {isTestnetModeEnabled && <TestnetModeTooltip />}
          <Web3Status />
        </NavItemsRow>
      </Flex>
    </Flex>
  )
}
