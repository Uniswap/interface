import { memo, useCallback, useEffect, useState } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { SpinningLoader } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { TokenDetailsEarnBanner as SharedTokenDetailsEarnBanner } from 'uniswap/src/components/tokenDetails/TokenDetailsEarnBanner'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import type { TokenDetailsEarnData } from 'uniswap/src/features/earn/hooks/useTokenDetailsEarnData'
import { shouldShowTokenDetailsEarnBanner } from 'uniswap/src/features/earn/tokenDetails'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'

type TokenDetailsEarnBannerProps = {
  activeAddress: Address | undefined
  earnData: TokenDetailsEarnData
}

type PendingPress = {
  requestedAtMs: number
  vaultId: string
  walletAddress: Address | undefined
}

export const TokenDetailsEarnBanner = memo(function TokenDetailsEarnBannerInner({
  activeAddress,
  earnData,
}: TokenDetailsEarnBannerProps): JSX.Element | null {
  const navigation = useAppStackNavigation()
  const { navigateToEarnVault } = useWalletNavigation()
  const [pendingPress, setPendingPress] = useState<PendingPress | null>(null)

  const { balanceUsd, earnVault, isLoggedIn, projectedAnnualEarningsUsd, tokenSymbol } = earnData
  const isVisible = shouldShowTokenDetailsEarnBanner(earnData) && earnVault !== undefined
  const isBannerVisible = isLoggedIn && isVisible
  useLogEarnSurfaceViewed({
    entryPoint: EarnEntryPoint.TokenDetailsEarnBanner,
    isVisible: isBannerVisible,
    surface: EarnAnalyticsSurface.Mobile,
  })
  const pendingPressMatchesCurrent =
    pendingPress !== null && pendingPress.vaultId === earnVault?.id && pendingPress.walletAddress === activeAddress
  const minimumBalanceDataUpdatedAtMs = pendingPressMatchesCurrent ? pendingPress.requestedAtMs : undefined
  const {
    balanceLookupErrored,
    balanceLookupHasData,
    balanceLookupSettled,
    hasSupportedBalanceForUnderlying,
    refetchBalanceLookup,
  } = useEarnDepositSources({
    vault: earnVault,
    walletAddress: activeAddress,
    isOpen: isBannerVisible,
    minimumBalanceDataUpdatedAtMs,
  })
  const isBalanceLookupPending = pendingPressMatchesCurrent && !balanceLookupSettled && !balanceLookupErrored

  const openEarnEntryPoint = useCallback(() => {
    if (!earnVault) {
      return
    }

    if (!isLoggedIn) {
      return
    }

    if (!balanceLookupSettled && !balanceLookupErrored) {
      return
    }

    if (balanceLookupHasData && !hasSupportedBalanceForUnderlying) {
      navigation.navigate(ModalName.EarnYouNeedToken, {
        currencyId: earnVault.displayCurrencyId,
      })
      return
    }

    navigateToEarnVault({
      analyticsEntryPoint: EarnEntryPoint.TokenDetailsEarnBanner,
      vault: earnVault,
      initialAction: EarnAction.Deposit,
      minimumBalanceDataUpdatedAtMs,
    })
  }, [
    balanceLookupErrored,
    balanceLookupHasData,
    balanceLookupSettled,
    earnVault,
    hasSupportedBalanceForUnderlying,
    isLoggedIn,
    minimumBalanceDataUpdatedAtMs,
    navigateToEarnVault,
    navigation,
  ])

  const handlePress = useCallback(() => {
    if (pendingPressMatchesCurrent) {
      setPendingPress(null)
      return
    }

    if (isLoggedIn && earnVault) {
      setPendingPress({ requestedAtMs: Date.now(), vaultId: earnVault.id, walletAddress: activeAddress })
      refetchBalanceLookup()
      return
    }

    openEarnEntryPoint()
  }, [activeAddress, earnVault, isLoggedIn, openEarnEntryPoint, pendingPressMatchesCurrent, refetchBalanceLookup])

  useEffect(() => {
    if ((!balanceLookupSettled && !balanceLookupErrored) || !pendingPressMatchesCurrent) {
      return
    }

    setPendingPress(null)
    openEarnEntryPoint()
  }, [balanceLookupErrored, balanceLookupSettled, openEarnEntryPoint, pendingPressMatchesCurrent])

  useEffect(() => {
    if (!isVisible || (pendingPress !== null && !pendingPressMatchesCurrent)) {
      setPendingPress(null)
    }
  }, [isVisible, pendingPress, pendingPressMatchesCurrent])

  if (!isBannerVisible) {
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
      trailingElement={
        isBalanceLookupPending ? (
          <SpinningLoader color="$neutral3" size={20} />
        ) : (
          <RotatableChevron direction="right" color="$neutral3" size="$icon.20" />
        )
      }
      onPress={handlePress}
    />
  )
})
