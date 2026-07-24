import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useCallback, useMemo, useState } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import type { EarnVaultModalProps } from 'src/components/earn/EarnVaultModalState'
import { Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { EarnVaultOverview } from 'uniswap/src/features/earn/EarnVaultOverview'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { useEarnPosition } from 'uniswap/src/features/earn/hooks/useEarnPosition'
import { EarnAction } from 'uniswap/src/features/earn/types'
import type { EarnVaultTab } from 'uniswap/src/features/earn/types'
import { hasConfirmedEarnPositionRawBalance } from 'uniswap/src/features/earn/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { noop } from 'utilities/src/react/noop'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function EarnVaultModal({
  analyticsEntryPoint,
  vault,
  position: prefetchedPosition,
  initialSelectedTab,
  isInfoOnly = false,
  isOpen,
  onClose,
}: EarnVaultModalProps & BaseModalProps): JSX.Element | null {
  const navigation = useAppStackNavigation()
  const insets = useAppInsets()
  const currencyInfo = useCurrencyInfo(vault?.displayCurrencyId)
  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: spacing.spacing16,
      paddingBottom: insets.bottom + spacing.spacing16,
    }),
    [insets.bottom],
  )

  const walletAddress = useActiveAccountAddress()
  const {
    position,
    isError: positionIsError,
    refetch: refetchPosition,
  } = useEarnPosition({
    vault,
    walletAddress: walletAddress ?? undefined,
    isConnected: true,
    enabled: isOpen,
    prefetchedPosition,
  })
  // Prefetched carries deposited/rate but not lifetime PnL. A failed live GetEarnPosition still shows
  // the balance from the prefetch and localizes the failure to the rewards row; only a total absence
  // of position data falls back to the full balance error.
  const displayPosition = position ?? prefetchedPosition
  const hasPosition = displayPosition !== undefined
  const canWithdraw = hasConfirmedEarnPositionRawBalance(displayPosition)
  const balanceError = positionIsError && prefetchedPosition === undefined
  const lifetimeEarningsError = positionIsError && prefetchedPosition !== undefined
  const [selectedTab, setSelectedTab] = useState<EarnVaultTab>(
    initialSelectedTab ?? (hasPosition || balanceError ? 'balance' : 'details'),
  )

  const { balanceLookupSettled, hasSupportedBalanceForUnderlying } = useEarnDepositSources({
    vault,
    walletAddress: walletAddress ?? undefined,
    isOpen,
  })

  const handleDeposit = useCallback(() => {
    // Wait for the balance lookup to settle — without this, a tap during the loading window
    // would silently fall through to the deposit sheet for a user who actually has no balance.
    if (!vault || !balanceLookupSettled) {
      return
    }
    // Use `replace` (not `navigate` + onClose) so the vault sheet is atomically swapped for
    // the next modal — calling onClose after navigate is a no-op because the vault has
    // already lost focus, leaving both sheets stacked.
    if (!hasSupportedBalanceForUnderlying) {
      navigation.replace(ModalName.EarnYouNeedToken, {
        currencyId: vault.displayCurrencyId,
      })
    } else {
      navigation.replace(ModalName.EarnDepositAmount, {
        analyticsEntryPoint,
        vault,
        position: displayPosition,
        initialAction: EarnAction.Deposit,
      })
    }
  }, [analyticsEntryPoint, balanceLookupSettled, displayPosition, hasSupportedBalanceForUnderlying, navigation, vault])

  const handleWithdraw = useCallback(() => {
    if (!vault || !canWithdraw) {
      return
    }
    navigation.replace(ModalName.EarnDepositAmount, {
      analyticsEntryPoint,
      vault,
      position: displayPosition,
      initialAction: EarnAction.Withdraw,
    })
  }, [analyticsEntryPoint, canWithdraw, displayPosition, navigation, vault])

  if (!vault) {
    return null
  }

  return (
    <Modal
      // The expanded overview can exceed the screen-height cap; render it in a scroll view (with
      // overrideInnerContainer so the shared static BottomSheetView doesn't clip it) and stop content
      // drags from dismissing so upward swipes scroll to the full disclaimer and footer.
      overrideInnerContainer
      enableContentPanningGesture={false}
      name={ModalName.EarnVault}
      isModalOpen={isOpen}
      maxWidth={420}
      onClose={onClose}
    >
      <BottomSheetScrollView contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
        <Flex gap="$spacing16">
          <EarnVaultOverview
            // Modal is only reachable from an active position, so a connected wallet is guaranteed.
            isConnected
            analyticsEntryPoint={analyticsEntryPoint ?? EarnEntryPoint.GlobalModal}
            analyticsSurface={EarnAnalyticsSurface.Mobile}
            showCloseIcon={false}
            vault={vault}
            currencyInfo={currencyInfo}
            canWithdraw={canWithdraw}
            hasPosition={hasPosition}
            position={displayPosition}
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            showActionButtons={!isInfoOnly}
            symbol={currencyInfo?.currency.symbol ?? ''}
            balanceError={balanceError}
            lifetimeEarningsUsd={position?.lifetimePnlUsd}
            lifetimeEarningsError={lifetimeEarningsError}
            onRetryBalance={refetchPosition}
            onClose={onClose}
            onConnectWallet={noop}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
          />
        </Flex>
      </BottomSheetScrollView>
    </Modal>
  )
}
