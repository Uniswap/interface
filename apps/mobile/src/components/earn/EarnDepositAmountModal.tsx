import { TradingApi } from '@universe/api'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { EarnDepositAmountContent } from 'src/components/earn/EarnDepositAmountContent'
import type { EarnDepositAmountModalState } from 'src/components/earn/EarnDepositAmountModalState'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  EarnAnalyticsSurface,
  EarnEntryPoint,
  getEarnVaultAnalyticsProperties,
  logEarnTransactionEvent,
} from 'uniswap/src/features/earn/analytics'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function EarnDepositAmountModal({
  analyticsEntryPoint = EarnEntryPoint.GlobalModal,
  vault,
  position,
  initialAction,
  initialChainId,
  initialAmount,
  initialSourceCurrencyId,
  initialWithdrawMode,
  startedAnalyticsKey,
  minimumBalanceDataUpdatedAtMs,
  originatingTransactionId,
  projectedMonthlyEarningsUsd,
  sourceUpsellCurrencyId,
  swapAmountUsd,
  isOpen,
  onClose,
}: EarnDepositAmountModalState & BaseModalProps): JSX.Element | null {
  // Capture navigation outside the bottom-sheet portal; portal navigation may miss `replace`.
  const navigation = useAppStackNavigation()
  const startedAnalyticsKeysRef = useRef(new Set<string>())

  const analyticsProperties = useMemo(() => {
    if (!vault) {
      return undefined
    }

    return getEarnVaultAnalyticsProperties({
      entryPoint: analyticsEntryPoint,
      position,
      surface: EarnAnalyticsSurface.Mobile,
      vault,
    })
  }, [analyticsEntryPoint, position, vault])

  const currentStartedAnalyticsKey = useMemo(() => {
    if (!initialAction || !vault) {
      return undefined
    }

    const action = initialAction === EarnAction.Withdraw ? 'withdraw' : 'deposit'
    return `${analyticsEntryPoint}-${vault.id}-${action}`
  }, [analyticsEntryPoint, initialAction, vault])

  useEffect(() => {
    if (!isOpen) {
      startedAnalyticsKeysRef.current.clear()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !analyticsProperties || !initialAction || !vault) {
      return
    }

    const action = initialAction === EarnAction.Withdraw ? 'withdraw' : 'deposit'
    const analyticsKey = currentStartedAnalyticsKey
    if (!analyticsKey || startedAnalyticsKey === analyticsKey) {
      return
    }

    if (startedAnalyticsKeysRef.current.has(analyticsKey)) {
      return
    }

    startedAnalyticsKeysRef.current.add(analyticsKey)
    logEarnTransactionEvent({
      action,
      status: 'started',
      properties: { ...analyticsProperties, action },
    })
  }, [analyticsProperties, currentStartedAnalyticsKey, initialAction, isOpen, startedAnalyticsKey, vault])

  const handleReview = useCallback(
    ({
      action,
      amount,
      tokenAmount,
      chainId,
      destinationCurrencyId,
      sourceCurrencyId,
      withdrawMode,
    }: {
      action: EarnAction
      amount: string
      tokenAmount?: string
      chainId: UniverseChainId
      destinationCurrencyId?: string
      sourceCurrencyId?: string
      withdrawMode?: TradingApi.EarnWithdrawMode
    }) => {
      if (!vault) {
        return
      }

      if (action === EarnAction.Withdraw) {
        if (!position || !destinationCurrencyId) {
          return
        }

        navigation.replace(ModalName.EarnWithdrawReview, {
          analyticsEntryPoint,
          vault,
          position,
          amount,
          chainId,
          destinationCurrencyId,
          startedAnalyticsKey: currentStartedAnalyticsKey ?? startedAnalyticsKey,
          withdrawMode,
        })
        return
      }

      navigation.replace(ModalName.EarnDepositReview, {
        analyticsEntryPoint,
        vault,
        position,
        amount,
        tokenAmount,
        originatingTransactionId,
        projectedMonthlyEarningsUsd,
        sourceChainId: chainId,
        sourceCurrencyId,
        sourceUpsellCurrencyId,
        startedAnalyticsKey: currentStartedAnalyticsKey ?? startedAnalyticsKey,
        swapAmountUsd,
      })
    },
    [
      analyticsEntryPoint,
      navigation,
      originatingTransactionId,
      position,
      projectedMonthlyEarningsUsd,
      sourceUpsellCurrencyId,
      startedAnalyticsKey,
      swapAmountUsd,
      vault,
      currentStartedAnalyticsKey,
    ],
  )

  // Stack the selector so it can pop back with merged params.
  const handleOpenNetworkSelector = useCallback(
    (currentChainId: UniverseChainId) => {
      navigation.navigate(ModalName.EarnWithdrawNetworkSelector, {
        currentChainId,
        underlyingCurrencyId: vault?.currencyId,
      })
    },
    [navigation, vault?.currencyId],
  )

  // Stack the selector so it can pop back with merged params.
  const handleOpenDepositSourceSelector = useCallback(() => {
    if (!vault) {
      return
    }
    navigation.navigate(ModalName.EarnDepositSourceSelector, {
      vaultCurrencyId: vault.currencyId,
      vaultDisplayCurrencyId: vault.displayCurrencyId,
    })
  }, [navigation, vault])

  if (!vault) {
    return null
  }

  return (
    <Modal
      fullScreen
      hideHandlebar
      renderBehindBottomInset
      renderBehindTopInset
      name={ModalName.EarnDepositAmount}
      isModalOpen={isOpen}
      onClose={onClose}
    >
      <EarnDepositAmountContent
        vault={vault}
        position={position}
        initialAction={initialAction}
        initialChainId={initialChainId}
        initialAmount={initialAmount}
        initialSourceCurrencyId={initialSourceCurrencyId}
        initialWithdrawMode={initialWithdrawMode}
        minimumBalanceDataUpdatedAtMs={minimumBalanceDataUpdatedAtMs}
        onReview={handleReview}
        onOpenNetworkSelector={handleOpenNetworkSelector}
        onOpenDepositSourceSelector={handleOpenDepositSourceSelector}
      />
    </Modal>
  )
}
