import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, type FlexCompatProps, heights, zIndexes } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { forwardRef } from 'react'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CompanyMenu } from '~/app/layout/NavBar/CompanyMenu'
import { NewUserCTAButton } from '~/app/layout/NavBar/DownloadApp/NewUserCTAButton'
import { PreferenceMenu } from '~/app/layout/NavBar/PreferencesMenu'
import { useTabsVisible } from '~/app/layout/NavBar/ScreenSizes'
import { SearchBar } from '~/app/layout/NavBar/SearchBar'
import { NavSearchVariant, useNavSearchVariant } from '~/app/layout/NavBar/SearchBar/useNavSearchVariant'
import { Tabs } from '~/app/layout/NavBar/Tabs/Tabs'
import { TestnetModeTooltip } from '~/app/layout/NavBar/TestnetMode/TestnetModeTooltip'
import { Web3Status } from '~/features/wallet/components/Web3Status'
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
  const searchVariant = useNavSearchVariant()
  const { isConnected } = useConnectionStatus()

  const { isTestnetModeEnabled } = useEnabledChains()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isNewUserUxEnabled = useFeatureFlag(FeatureFlags.NewUserUx)
  // On mobile the right-row glyphs sit 20px apart, spaced per item instead of by the row gap. The testnet
  // pill doesn't follow that rhythm, so with it shown the row keeps the default gap.
  const isCompactMobileRow = !isTestnetModeEnabled && !isNewUserUxEnabled
  const rightRowMd: FlexCompatProps['$md'] = isNewUserUxEnabled
    ? { gap: '$spacing4' }
    : isCompactMobileRow
      ? { gap: '$none' }
      : undefined
  const isSearchBarCentered = searchVariant === NavSearchVariant.LegacyInput

  return (
    <Flex
      tag="nav"
      position="unset"
      px="$padding12"
      $md={{ px: '$padding16' }}
      width="100%"
      height={heights['interface-nav']}
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
          {isSearchBarCentered ? <SearchBar variant={searchVariant} /> : null}
        </Flex>

        <NavItemsRow justifyContent="flex-end" $md={rightRowMd}>
          {!isSearchBarCentered && <SearchBar variant={searchVariant} />}
          {!isConnected && !isEmbeddedWalletEnabled && !isNewUserUxEnabled && isLandingPage && !isSmallScreen && (
            <NewUserCTAButton />
          )}
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
