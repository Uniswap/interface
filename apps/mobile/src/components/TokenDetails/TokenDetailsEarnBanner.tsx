import { SpinningLoader } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { memo, useCallback, useEffect, useState } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { TokenDetailsEarnBanner as SharedTokenDetailsEarnBanner } from 'uniswap/src/components/tokenDetails/TokenDetailsEarnBanner'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import type { TokenDetailsEarnData } from 'uniswap/src/features/earn/hooks/useTokenDetailsEarnData'
import { shouldShowTokenDetailsEarnBanner } from 'uniswap/src/features/earn/tokenDetails'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useIsViewOnlyWallet } from 'wallet/src/features/wallet/hooks'

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
  const isViewOnlyWallet = useIsViewOnlyWallet()
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
    // View-only wallets route straight to the vault overview, so the lookup is unused.
    isOpen: isBannerVisible && !isViewOnlyWallet,
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

    // View-only wallets stop at the vault overview. Must return before the settled guard
    // below: their sources lookup is disabled (isOpen above), so it never settles.
    if (isViewOnlyWallet) {
      navigateToEarnVault({
        analyticsEntryPoint: EarnEntryPoint.TokenDetailsEarnBanner,
        vault: earnVault,
      })
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
    isViewOnlyWallet,
    minimumBalanceDataUpdatedAtMs,
    navigateToEarnVault,
    navigation,
  ])

  const handlePress = useCallback(() => {
    if (pendingPressMatchesCurrent) {
      setPendingPress(null)
      return
    }

    // No balance refresh needed for view-only — go straight to the vault overview.
    if (isViewOnlyWallet) {
      openEarnEntryPoint()
      return
    }

    if (isLoggedIn && earnVault) {
      setPendingPress({ requestedAtMs: Date.now(), vaultId: earnVault.id, walletAddress: activeAddress })
      refetchBalanceLookup()
      return
    }

    openEarnEntryPoint()
  }, [
    activeAddress,
    earnVault,
    isLoggedIn,
    isViewOnlyWallet,
    openEarnEntryPoint,
    pendingPressMatchesCurrent,
    refetchBalanceLookup,
  ])

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
