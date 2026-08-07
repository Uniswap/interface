import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Flex, HeightAnimator, TransitionItem } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { selectHasAcknowledgedEarnHowItWorks } from 'uniswap/src/features/behaviorHistory/selectors'
import {
  EarnAnalyticsSurface,
  EarnEntryPoint,
  getEarnVaultAnalyticsProperties,
  logEarnTransactionEvent,
  logEarnVaultSelected,
} from 'uniswap/src/features/earn/analytics'
import { useAcknowledgeEarnHowItWorks } from 'uniswap/src/features/earn/hooks/useAcknowledgeEarnHowItWorks'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { useEarnMainnetActionCurrencyForVault } from 'uniswap/src/features/earn/hooks/useEarnMainnetActionCurrency'
import { EarnPositionStatus, useEarnPosition } from 'uniswap/src/features/earn/hooks/useEarnPosition'
import { resetStoppedEarnPlan } from 'uniswap/src/features/earn/hooks/useEarnReviewExecutionHandlers'
import {
  type EarnVaultModalInitialView,
  EarnVaultView,
  useEarnVaultModalFlow,
} from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { hasConfirmedEarnPositionRawBalance } from 'uniswap/src/features/earn/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import type {
  EarnAnalyticsEntryPoint,
  EarnAnalyticsSurface as EarnAnalyticsSurfaceValue,
} from 'uniswap/src/features/telemetry/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { UniswapState } from 'uniswap/src/state/uniswapReducer'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { signalEarnModalClosed } from 'uniswap/src/utils/saga'
import { noop } from 'utilities/src/react/noop'
import { useActiveAccount } from '~/features/accounts/store/hooks'
import { EarnVaultModalContent } from '~/features/earn/EarnVaultModalContent'
import { useEarnVaultTransitionDirection } from '~/features/earn/hooks/useEarnVaultTransitionDirection'
import { useAccount } from '~/hooks/useAccount'

interface EarnVaultModalProps {
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
  analyticsSurface?: EarnAnalyticsSurfaceValue
  vault: EarnVaultInfo | null
  prefetchedPosition?: EarnPositionInfo
  initialView?: EarnVaultModalInitialView
  minimumBalanceDataUpdatedAtMs?: number
  originatingTransactionId?: string
  projectedMonthlyEarningsUsd?: number
  sourceUpsellCurrencyId?: string
  swapAmountUsd?: number
  isOpen: boolean
  onClose: () => void
  onConnectWallet?: () => void
}

// Keep the full vault flow in one modal to avoid backdrop flicker between steps.
export function EarnVaultModal({
  analyticsEntryPoint = EarnEntryPoint.GlobalModal,
  analyticsSurface = EarnAnalyticsSurface.Web,
  vault,
  prefetchedPosition,
  initialView = EarnVaultView.Vault,
  minimumBalanceDataUpdatedAtMs,
  originatingTransactionId,
  projectedMonthlyEarningsUsd,
  sourceUpsellCurrencyId,
  swapAmountUsd,
  isOpen,
  onClose,
  onConnectWallet,
}: EarnVaultModalProps) {
  const account = useAccount()
  const dispatch = useDispatch()
  const { navigateToSwapFlow, navigateToFiatOnRamp } = useUniswapContext()
  const isConnected = account.isConnected
  const evmAccount = useActiveAccount(Platform.EVM)
  const hasAcknowledgedHowItWorks = useSelector((state: UniswapState) =>
    selectHasAcknowledgedEarnHowItWorks(state, vault?.id),
  )
  const currencyInfo = useCurrencyInfo(vault?.displayCurrencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? ''
  const selectedAnalyticsKeyRef = useRef<string | undefined>(undefined)
  const startedAnalyticsKeysRef = useRef(new Set<string>())
  const {
    balanceLookupErrored,
    balanceLookupHasData,
    balanceLookupSettled,
    depositSourceOptions,
    hasSupportedBalanceForUnderlying,
    refetchBalanceLookup,
    selectedDepositSource,
    setSelectedDepositSourceCurrencyId,
    unsupportedDepositSourceOptions,
  } = useEarnDepositSources({
    vault,
    walletAddress: evmAccount?.address,
    isOpen,
    initialSourceCurrencyId: sourceUpsellCurrencyId,
    minimumBalanceDataUpdatedAtMs,
    resetSelectionOnClose: true,
  })
  const { currencyIdForSwap, currencyInfoForActions } = useEarnMainnetActionCurrencyForVault({ vault })

  const {
    position,
    positionStatus,
    isError: positionIsError,
    refetch: refetchPosition,
  } = useEarnPosition({
    vault,
    walletAddress: evmAccount?.address,
    isConnected,
    enabled: isOpen,
    prefetchedPosition,
  })
  // Prefetched (ListEarnPositions) carries deposited/rate but not lifetime PnL. When the live
  // GetEarnPosition fails we still show the balance from the prefetch and localize the failure to
  // the rewards row; only a total absence of position data falls back to the full balance error.
  const displayPosition = position ?? prefetchedPosition
  const hasPosition = displayPosition !== undefined
  const balanceError = isConnected && positionIsError && prefetchedPosition === undefined
  const lifetimeEarningsError = isConnected && positionIsError && prefetchedPosition !== undefined
  const canWithdraw = hasConfirmedEarnPositionRawBalance(displayPosition)
  const isPositionLoading = positionStatus === EarnPositionStatus.Loading && displayPosition === undefined

  const {
    flow,
    selectedTab,
    setSelectedTab,
    reset,
    startDeposit,
    continueDeposit,
    startNeedToken,
    submitDepositAmount,
    backToDepositAmount,
    startWithdraw,
    submitWithdrawAmount,
    backToWithdrawAmount,
    backToVault,
  } = useEarnVaultModalFlow({
    hasPosition,
    initialPosition: displayPosition,
    initialView,
    isOpen,
    shouldShowHowItWorks: !hasAcknowledgedHowItWorks,
    vaultId: vault?.id,
  })
  const transitionDirection = useEarnVaultTransitionDirection(flow.view)

  const analyticsProperties = useMemo(() => {
    if (!vault) {
      return undefined
    }

    return getEarnVaultAnalyticsProperties({
      entryPoint: analyticsEntryPoint,
      position: displayPosition,
      surface: analyticsSurface,
      underlyingTokenSymbol: symbol,
      vault,
    })
  }, [analyticsEntryPoint, analyticsSurface, displayPosition, symbol, vault])

  useEffect(() => {
    if (!isOpen) {
      selectedAnalyticsKeyRef.current = undefined
      startedAnalyticsKeysRef.current.clear()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !analyticsProperties || !vault) {
      return
    }

    const analyticsKey = `${analyticsEntryPoint}-${vault.id}`
    if (selectedAnalyticsKeyRef.current === analyticsKey) {
      return
    }

    selectedAnalyticsKeyRef.current = analyticsKey
    logEarnVaultSelected(analyticsProperties)
  }, [analyticsEntryPoint, analyticsProperties, isOpen, vault])

  useEffect(() => {
    if (!isOpen || !analyticsProperties || !vault) {
      return
    }

    const action =
      flow.view === EarnVaultView.DepositAmount
        ? 'deposit'
        : flow.view === EarnVaultView.WithdrawAmount
          ? 'withdraw'
          : undefined
    if (!action) {
      return
    }

    const analyticsKey = `${analyticsEntryPoint}-${vault.id}-${action}`
    if (startedAnalyticsKeysRef.current.has(analyticsKey)) {
      return
    }

    startedAnalyticsKeysRef.current.add(analyticsKey)
    logEarnTransactionEvent({
      action,
      status: 'started',
      properties: { ...analyticsProperties, action },
    })
  }, [analyticsEntryPoint, analyticsProperties, flow.view, isOpen, vault])

  // Every dismissal path funnels here (Escape, backdrop, close button), so this is where a
  // stopped partial plan must be cleared — not only the review view's buttons.
  const handleClose = useCallback(() => {
    dispatch(signalEarnModalClosed())
    resetStoppedEarnPlan()
    reset()
    onClose()
  }, [dispatch, onClose, reset])

  const handleWithdraw = useCallback(() => {
    if (displayPosition && canWithdraw) {
      startWithdraw(displayPosition)
    }
  }, [canWithdraw, displayPosition, startWithdraw])

  // Wait for balance lookup before routing users to deposit vs. need-token.
  const handleDeposit = useCallback(() => {
    if (isConnected && balanceLookupHasData && !hasSupportedBalanceForUnderlying) {
      startNeedToken()
      return
    }
    startDeposit()
  }, [balanceLookupHasData, hasSupportedBalanceForUnderlying, isConnected, startDeposit, startNeedToken])

  const handleContinueDeposit = useAcknowledgeEarnHowItWorks({
    analyticsProperties,
    onContinue: continueDeposit,
    vaultId: vault?.id,
  })
  const isHowItWorksView = flow.view === EarnVaultView.HowItWorks

  // External DepositAmount entry points still need the balance guard.
  useEffect(() => {
    if (
      isOpen &&
      flow.view === EarnVaultView.DepositAmount &&
      isConnected &&
      balanceLookupHasData &&
      !hasSupportedBalanceForUnderlying
    ) {
      startNeedToken()
    }
  }, [balanceLookupHasData, flow.view, hasSupportedBalanceForUnderlying, isConnected, isOpen, startNeedToken])

  const handleSwapForToken = useCallback(() => {
    if (!currencyIdForSwap) {
      return
    }
    navigateToSwapFlow({ outputCurrencyId: currencyIdForSwap })
    handleClose()
  }, [currencyIdForSwap, handleClose, navigateToSwapFlow])

  const handleBuyWithCash = useCallback(() => {
    if (!currencyInfoForActions) {
      return
    }
    navigateToFiatOnRamp({
      prefilledCurrency: { currencyInfo: currencyInfoForActions },
    })
    handleClose()
  }, [currencyInfoForActions, handleClose, navigateToFiatOnRamp])

  return (
    <Modal
      name={ModalName.EarnVault}
      isModalOpen={isOpen}
      testID={TestID.EarnVaultModal}
      maxWidth={420}
      padding={isHowItWorksView ? '$none' : '$spacing16'}
      pt={isHowItWorksView ? '$spacing16' : undefined}
      gap="$spacing16"
      backgroundColor="$surface1"
      onClose={handleClose}
    >
      <HeightAnimator animation="quickLong">
        <TransitionItem animation="quickLong" animationType={transitionDirection} childKey={flow.view} distance={24}>
          {/* Preserve the modal's section gap after introducing the animation wrapper. */}
          <Flex gap="$spacing16">
            <EarnVaultModalContent
              analyticsEntryPoint={analyticsEntryPoint}
              analyticsSurface={analyticsSurface}
              onConnectWallet={onConnectWallet ?? noop}
              flow={flow}
              flowHandlers={{
                onBackToDepositAmount: backToDepositAmount,
                onBackToVault: backToVault,
                onBackToWithdrawAmount: backToWithdrawAmount,
                onBuyWithCash: handleBuyWithCash,
                onClose: handleClose,
                onContinueDeposit: handleContinueDeposit,
                onDeposit: handleDeposit,
                onReviewDeposit: submitDepositAmount,
                onReviewWithdraw: submitWithdrawAmount,
                onSwapForToken: handleSwapForToken,
                onWithdraw: handleWithdraw,
              }}
              originatingTransactionId={originatingTransactionId}
              projectedMonthlyEarningsUsd={projectedMonthlyEarningsUsd}
              sourceUpsellCurrencyId={sourceUpsellCurrencyId}
              swapAmountUsd={swapAmountUsd}
              tabState={{ selectedTab, setSelectedTab }}
              vaultData={{
                balanceLookupErrored,
                balanceLookupHasData,
                balanceLookupSettled,
                onRetryBalanceLookup: refetchBalanceLookup,
                balanceError,
                onRetryBalance: refetchPosition,
                lifetimeEarningsUsd: position?.lifetimePnlUsd,
                lifetimeEarningsError,
                canWithdraw,
                currencyInfo,
                depositSourceOptions,
                hasPosition,
                isConnected,
                isPositionLoading,
                position: displayPosition,
                selectedDepositSource,
                setSelectedDepositSourceCurrencyId,
                symbol,
                unsupportedDepositSourceOptions,
                vault,
              }}
            />
          </Flex>
        </TransitionItem>
      </HeightAnimator>
    </Modal>
  )
}
