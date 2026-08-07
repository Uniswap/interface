import { TradingApi } from '@universe/api'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { EarnDepositAmountContent } from 'src/components/earn/EarnDepositAmountContent'
import type { EarnDepositAmountModalState } from 'src/components/earn/EarnDepositAmountModalState'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { selectHasAcknowledgedEarnHowItWorks } from 'uniswap/src/features/behaviorHistory/selectors'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  EarnAnalyticsSurface,
  EarnEntryPoint,
  getEarnVaultAnalyticsProperties,
  logEarnTransactionEvent,
} from 'uniswap/src/features/earn/analytics'
import { useEarnPosition } from 'uniswap/src/features/earn/hooks/useEarnPosition'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { resolveEarnAmountPosition } from 'uniswap/src/features/earn/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import type { UniswapState } from 'uniswap/src/state/uniswapReducer'
import { useEvent } from 'utilities/src/react/hooks'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function EarnDepositAmountModal({
  isOpen,
  onClose,
  ...routeState
}: EarnDepositAmountModalState & BaseModalProps): JSX.Element | null {
  const {
    analyticsEntryPoint = EarnEntryPoint.GlobalModal,
    vault,
    position: prefetchedPosition,
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
  } = routeState
  const { fullHeight } = useDeviceDimensions()
  // Capture navigation outside the bottom-sheet portal; portal navigation may miss `replace`.
  const navigation = useAppStackNavigation()
  const startedAnalyticsKeysRef = useRef(new Set<string>())
  const hasAcknowledgedHowItWorks = useSelector((state: UniswapState) =>
    selectHasAcknowledgedEarnHowItWorks(state, vault?.id),
  )
  const shouldRedirectToHowItWorks = initialAction !== EarnAction.Withdraw && !hasAcknowledgedHowItWorks
  const walletAddress = useActiveAccountAddress()
  const { position: livePosition } = useEarnPosition({
    vault,
    walletAddress: walletAddress ?? undefined,
    isConnected: true,
    enabled: isOpen,
    prefetchedPosition,
  })
  const position = prefetchedPosition
    ? resolveEarnAmountPosition({ livePosition, snapshotPosition: prefetchedPosition })
    : livePosition

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
    if (!isOpen || shouldRedirectToHowItWorks || !analyticsProperties || !initialAction || !vault) {
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
  }, [
    analyticsProperties,
    currentStartedAnalyticsKey,
    initialAction,
    isOpen,
    shouldRedirectToHowItWorks,
    startedAnalyticsKey,
    vault,
  ])

  const redirectToHowItWorks = useEvent(
    (
      overrides?: Partial<EarnDepositAmountModalState>,
      { clearWithdrawState = false }: { clearWithdrawState?: boolean } = {},
    ) => {
      const nextRouteState = { ...routeState, ...overrides }
      if (clearWithdrawState) {
        delete nextRouteState.initialAmount
        delete nextRouteState.initialChainId
        delete nextRouteState.initialWithdrawMode
        delete nextRouteState.startedAnalyticsKey
      }

      navigation.replace(ModalName.EarnHowItWorks, {
        ...nextRouteState,
        analyticsEntryPoint,
        vault,
        position: prefetchedPosition,
      })
    },
  )

  useEffect(() => {
    if (!isOpen || !vault || !shouldRedirectToHowItWorks) {
      return
    }

    redirectToHowItWorks()
  }, [isOpen, redirectToHowItWorks, shouldRedirectToHowItWorks, vault])

  const handleActionChange = useEvent((action: EarnAction): boolean => {
    if (action !== EarnAction.Deposit || hasAcknowledgedHowItWorks) {
      return true
    }

    redirectToHowItWorks({ initialAction: EarnAction.Deposit }, { clearWithdrawState: true })
    return false
  })

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

  const handleOpenVaultDetails = useCallback(() => {
    if (!vault) {
      return
    }
    navigation.navigate(ModalName.EarnVault, {
      analyticsEntryPoint,
      vault,
      position,
      initialSelectedTab: 'details',
      isInfoOnly: true,
    })
  }, [analyticsEntryPoint, navigation, position, vault])

  if (!vault || shouldRedirectToHowItWorks) {
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
      {/* Give the content an explicit full-screen host so the CTA and keypad align vertically. */}
      <View style={{ height: fullHeight }}>
        <EarnDepositAmountContent
          vault={vault}
          position={position}
          initialAction={initialAction}
          initialChainId={initialChainId}
          initialAmount={initialAmount}
          initialSourceCurrencyId={initialSourceCurrencyId}
          initialWithdrawMode={initialWithdrawMode}
          minimumBalanceDataUpdatedAtMs={minimumBalanceDataUpdatedAtMs}
          onActionChange={handleActionChange}
          onReview={handleReview}
          onOpenVaultDetails={handleOpenVaultDetails}
          onOpenNetworkSelector={handleOpenNetworkSelector}
          onOpenDepositSourceSelector={handleOpenDepositSourceSelector}
        />
      </View>
    </Modal>
  )
}
