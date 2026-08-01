import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import {
  EarnAnalyticsSurface,
  EarnEntryPoint,
  getEarnVaultAnalyticsProperties,
  logEarnTransactionEvent,
  logEarnVaultSelected,
} from 'uniswap/src/features/earn/analytics'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { useEarnMainnetActionCurrencyForVault } from 'uniswap/src/features/earn/hooks/useEarnMainnetActionCurrency'
import { EarnPositionStatus, useEarnPosition } from 'uniswap/src/features/earn/hooks/useEarnPosition'
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
import { signalEarnModalClosed } from 'uniswap/src/utils/saga'
import { noop } from 'utilities/src/react/noop'
import { useActiveAccount } from '~/features/accounts/store/hooks'
import { EarnVaultModalContent } from '~/features/earn/EarnVaultModalContent'
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
    vaultId: vault?.id,
  })

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

  const handleClose = useCallback(() => {
    dispatch(signalEarnModalClosed())
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
      maxWidth={420}
      padding="$spacing16"
      gap="$spacing16"
      backgroundColor="$surface1"
      onClose={handleClose}
    >
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
    </Modal>
  )
}
