import { memo, useCallback } from 'react'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { TokenDetailsEarnBanner as SharedTokenDetailsEarnBanner } from 'uniswap/src/components/tokenDetails/TokenDetailsEarnBanner'
import type { TokenDetailsEarnData } from 'uniswap/src/features/earn/hooks/useTokenDetailsEarnData'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'

type TokenDetailsEarnBannerProps = {
  earnData: TokenDetailsEarnData
}

export const TokenDetailsEarnBanner = memo(function TokenDetailsEarnBannerInner({
  earnData,
}: TokenDetailsEarnBannerProps): JSX.Element | null {
  const { navigateToEarnVault } = useWalletNavigation()

  const {
    balanceUsd,
    earnVault,
    hasLoadedPositions,
    isLoggedIn,
    projectedAnnualEarningsUsd,
    tokenSymbol,
    userHasEarnPosition,
  } = earnData

  const handlePress = useCallback(() => {
    if (!earnVault) {
      return
    }
    navigateToEarnVault({ vault: earnVault })
  }, [earnVault, navigateToEarnVault])

  if (!isLoggedIn || !earnVault || !hasLoadedPositions || userHasEarnPosition) {
    return null
  }

  return (
    <SharedTokenDetailsEarnBanner
      shortSubtitle
      apyPercent={earnVault.apyPercent}
      tokenSymbol={tokenSymbol}
      balanceUsd={balanceUsd}
      projectedAnnualEarningsUsd={projectedAnnualEarningsUsd}
      titleVariant="body3"
      subtitleVariant="body4"
      padding="$spacing12"
      paddingRight="$spacing12"
      trailingElement={<RotatableChevron direction="right" color="$neutral3" size="$icon.20" />}
      onPress={handlePress}
    />
  )
})
