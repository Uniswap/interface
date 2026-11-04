import { Flex, iconSizes } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { memo, useCallback } from 'react'
import { TokenDetailsVaultShareBanner as SharedTokenDetailsVaultShareBanner } from 'uniswap/src/components/tokenDetails/TokenDetailsVaultShareBanner'
import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import type { TokenDetailsVaultShareData } from 'uniswap/src/features/earn/hooks/useTokenDetailsVaultShareData'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'

type TokenDetailsVaultShareBannerProps = {
  vaultShareData: TokenDetailsVaultShareData
}

export const TokenDetailsVaultShareBanner = memo(function TokenDetailsVaultShareBannerInner({
  vaultShareData,
}: TokenDetailsVaultShareBannerProps): JSX.Element | null {
  const { navigateToEarnVault } = useWalletNavigation()
  const { vault, underlyingCurrencyInfo, isLoggedIn, hasLoadedPositions, userHasPosition } = vaultShareData

  const handlePress = useCallback(() => {
    if (!vault) {
      return
    }
    navigateToEarnVault({ analyticsEntryPoint: EarnEntryPoint.TokenDetailsVaultShareBanner, vault })
  }, [vault, navigateToEarnVault])

  // Only shown to connected users — the earn vault modal's connect flow isn't wired up from this
  // banner. Wait for positions to load so we don't flash the deposit variant before switching to
  // "manage".
  if (!vault || !isLoggedIn || !hasLoadedPositions) {
    return null
  }

  return (
    <Flex px="$spacing16">
      <SharedTokenDetailsVaultShareBanner
        hideSubtitle
        apyPercent={vault.apyPercent}
        underlyingCurrencyInfo={underlyingCurrencyInfo}
        hasPosition={userHasPosition}
        iconSize={iconSizes.icon28}
        padding="$spacing12"
        paddingRight="$spacing12"
        trailingElement={<RotatableChevron direction="right" color="$neutral3" size="$icon.20" />}
        onPress={handlePress}
      />
    </Flex>
  )
})
