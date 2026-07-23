import { useQueryClient } from '@tanstack/react-query'
import type { TradingApi } from '@universe/api'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, SpinningLoader } from 'ui/src'
import { permanentlyDismissEarnSwapUpsell } from 'uniswap/src/features/behaviorHistory/slice'
import { DepositReviewView, type ExecuteEarnDepositParams } from 'uniswap/src/features/earn/DepositReviewView'
import { EarnBalanceErrorState } from 'uniswap/src/features/earn/EarnBalanceErrorState'
import { EarnVaultOverview } from 'uniswap/src/features/earn/EarnVaultOverview'
import { EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import { applyEarnPositionChangeOptimistically } from 'uniswap/src/features/earn/optimisticEarnPositions'
import { getValidEarnSwapUpsellCurrencyId } from 'uniswap/src/features/earn/swapUpsell'
import { EarnAction, type EarnPositionInfo } from 'uniswap/src/features/earn/types'
import { resolveEarnWithdrawPosition } from 'uniswap/src/features/earn/utils'
import { WithdrawReviewView, type ExecuteEarnWithdrawParams } from 'uniswap/src/features/earn/WithdrawReviewView'
import { YouNeedTokenView } from 'uniswap/src/features/earn/YouNeedTokenView'
import { useLocalFiatToUSDConverter } from 'uniswap/src/features/fiatCurrency/useLocalFiatToUSDConverter'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { DEFAULT_TXN_DISMISS_MS } from '~/constants/misc'
import { useActiveAccount } from '~/features/accounts/store/hooks'
import { DepositAmountView } from '~/features/earn/DepositAmountView'
import { useEarnSagaCallback } from '~/features/earn/hooks/useEarnSagaCallback'
import type { EarnVaultModalContentProps } from '~/features/earn/types'
import { WithdrawAmountView } from '~/features/earn/WithdrawAmountView'
import { useColor } from '~/hooks/useColor'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

export function EarnVaultModalContent({
  analyticsEntryPoint,
  analyticsSurface,
  onConnectWallet,
  flow,
  flowHandlers,
  originatingTransactionId,
  projectedMonthlyEarningsUsd,
  sourceUpsellCurrencyId,
  swapAmountUsd,
  tabState,
  vaultData,
}: EarnVaultModalContentProps): JSX.Element | null {
  const {
    balanceLookupErrored,
    balanceLookupHasData,
    balanceLookupSettled,
    balanceError,
    canWithdraw,
    currencyInfo,
    depositSourceOptions,
    hasPosition,
    isConnected,
    isPositionLoading,
    lifetimeEarningsError,
    lifetimeEarningsUsd,
    onRetryBalance,
    onRetryBalanceLookup,
    position,
    selectedDepositSource,
    setSelectedDepositSourceCurrencyId,
    symbol,
    unsupportedDepositSourceOptions,
    vault,
  } = vaultData
  const tokenColor = useColor(currencyInfo?.currency)
  const {
    onBackToDepositAmount,
    onBackToVault,
    onBackToWithdrawAmount,
    onBuyWithCash,
    onClose,
    onDeposit,
    onReviewDeposit,
    onReviewWithdraw,
    onSwapForToken,
    onWithdraw,
  } = flowHandlers
  const { selectedTab, setSelectedTab } = tabState
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const earnSagaCallback = useEarnSagaCallback()
  const evmAccount = useActiveAccount(Platform.EVM)
  const queryClient = useQueryClient()
  const localFiatToUsd = useLocalFiatToUSDConverter()

  const handleSuccessfulEarnPositionChange = useCallback(
    ({
      action,
      amount,
      currentPosition,
      withdrawMode,
    }: {
      action: EarnAction
      amount: string
      currentPosition: EarnPositionInfo | undefined
      withdrawMode?: TradingApi.EarnWithdrawMode
    }): void => {
      applyEarnPositionChangeOptimistically({
        action,
        amount,
        currentPosition,
        localFiatToUsd,
        queryClient,
        vault: vault ?? undefined,
        walletAddress: evmAccount?.address,
        withdrawMode,
      })
    },
    [evmAccount?.address, localFiatToUsd, queryClient, vault],
  )

  const handleDepositExecutionFailure = useCallback(
    () => addEarnFailurePopup('deposit', t('common.error.general')),
    [t],
  )
  const handleWithdrawExecutionFailure = useCallback(
    () => addEarnFailurePopup('withdraw', t('common.error.general')),
    [t],
  )

  const runEarnExecution = useCallback(
    (params: ExecuteEarnDepositParams | ExecuteEarnWithdrawParams, onFinalizedSuccess: () => void) => {
      earnSagaCallback({
        earnIntent: params.earnIntent,
        inputCurrency: params.inputCurrency,
        outputCurrency: params.outputCurrency,
        quote: params.quote,
        onSuccess: params.onSuccess,
        onFailure: params.onFailure,
        onSubmitted: params.onSubmitted,
        onPlanFinalized: (finalizedParams) => {
          params.onPlanFinalized?.(finalizedParams)

          if (finalizedParams.status !== TransactionStatus.Success) {
            return
          }

          onFinalizedSuccess()
        },
      })
    },
    [earnSagaCallback],
  )

  const handleExecuteDeposit = useCallback(
    (
      params: ExecuteEarnDepositParams,
      optimisticContext: {
        amount: string
        currentPosition: EarnPositionInfo | undefined
      },
    ) => {
      runEarnExecution(params, () => {
        handleSuccessfulEarnPositionChange({
          action: EarnAction.Deposit,
          amount: optimisticContext.amount,
          currentPosition: optimisticContext.currentPosition,
        })
        if (vault) {
          dispatch(
            permanentlyDismissEarnSwapUpsell({
              tokenCurrencyId:
                sourceUpsellCurrencyId ??
                getValidEarnSwapUpsellCurrencyId(vault.displayCurrencyId) ??
                vault.displayCurrencyId,
            }),
          )
        }
      })
    },
    [dispatch, handleSuccessfulEarnPositionChange, runEarnExecution, sourceUpsellCurrencyId, vault],
  )

  const handleExecuteWithdraw = useCallback(
    (
      params: ExecuteEarnWithdrawParams,
      optimisticContext: {
        amount: string
        currentPosition: EarnPositionInfo | undefined
      },
    ) => {
      runEarnExecution(params, () => {
        handleSuccessfulEarnPositionChange({
          action: EarnAction.Withdraw,
          amount: optimisticContext.amount,
          currentPosition: optimisticContext.currentPosition,
          withdrawMode: params.withdrawMode,
        })
      })
    },
    [handleSuccessfulEarnPositionChange, runEarnExecution],
  )

  if (!vault) {
    return null
  }

  if (flow.view === EarnVaultView.DepositAmount && isConnected) {
    if (balanceLookupErrored && !balanceLookupHasData) {
      return <CenteredModalBalanceError onRetry={onRetryBalanceLookup} />
    }

    // Avoid flashing DepositAmount before balance lookup can redirect to NeedToken.
    if (!balanceLookupSettled) {
      return <CenteredModalLoader />
    }
  }

  switch (flow.view) {
    case EarnVaultView.Vault:
      // Unknown position state should not flash the no-position fork.
      if (isPositionLoading) {
        return <CenteredModalLoader />
      }
      return (
        <EarnVaultOverview
          onConnectWallet={onConnectWallet}
          currencyInfo={currencyInfo}
          canWithdraw={canWithdraw}
          hasPosition={hasPosition}
          isConnected={isConnected}
          onClose={onClose}
          onDeposit={onDeposit}
          onWithdraw={onWithdraw}
          position={position}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          symbol={symbol}
          vault={vault}
          balanceError={balanceError}
          lifetimeEarningsUsd={lifetimeEarningsUsd}
          lifetimeEarningsError={lifetimeEarningsError}
          onRetryBalance={onRetryBalance}
        />
      )
    case EarnVaultView.NeedToken:
      return (
        <YouNeedTokenView
          currencyInfo={currencyInfo}
          symbol={symbol}
          tokenColor={tokenColor}
          onBack={onBackToVault}
          onClose={onClose}
          onSwapForToken={onSwapForToken}
          onBuyWithCash={onBuyWithCash}
        />
      )
    case EarnVaultView.DepositAmount:
      return (
        <DepositAmountView
          vault={vault}
          depositSourceOptions={depositSourceOptions}
          selectedDepositSource={selectedDepositSource}
          onSelectDepositSource={setSelectedDepositSourceCurrencyId}
          unsupportedDepositSourceOptions={unsupportedDepositSourceOptions}
          initialAmount={flow.amount}
          initialIsMax={flow.isMax}
          onBack={onBackToVault}
          onClose={onClose}
          onReview={onReviewDeposit}
        />
      )
    case EarnVaultView.DepositReview:
      return (
        <DepositReviewView
          analyticsEntryPoint={analyticsEntryPoint}
          analyticsSurface={analyticsSurface}
          vault={vault}
          position={position}
          amount={flow.amount}
          tokenAmount={flow.tokenAmount}
          sourceChainId={flow.sourceChainId}
          sourceCurrencyId={flow.sourceCurrencyId}
          originatingTransactionId={originatingTransactionId}
          projectedMonthlyEarningsUsd={projectedMonthlyEarningsUsd}
          sourceUpsellCurrencyId={sourceUpsellCurrencyId}
          swapAmountUsd={swapAmountUsd}
          onBack={onBackToDepositAmount}
          onClose={onClose}
          onDeposit={onClose}
          onExecuteDeposit={(params) =>
            handleExecuteDeposit(params, {
              amount: flow.amount,
              currentPosition: position,
            })
          }
          onExecutionFailure={handleDepositExecutionFailure}
        />
      )
    case EarnVaultView.WithdrawAmount: {
      // Prefer live raw balances over a zero-raw optimistic snapshot.
      const withdrawPosition = resolveEarnWithdrawPosition({
        livePosition: position,
        snapshotPosition: flow.position,
      })
      return (
        <WithdrawAmountView
          vault={vault}
          position={withdrawPosition}
          initialAmount={flow.amount}
          initialChainId={flow.chainId}
          initialWithdrawMode={flow.withdrawMode}
          onBack={onBackToVault}
          onClose={onClose}
          onReview={onReviewWithdraw}
        />
      )
    }
    case EarnVaultView.WithdrawReview: {
      // MAX_SHARES quotes need confirmed sharesRaw.
      const withdrawPosition = resolveEarnWithdrawPosition({
        livePosition: position,
        snapshotPosition: flow.position,
      })
      return (
        <WithdrawReviewView
          analyticsEntryPoint={analyticsEntryPoint}
          analyticsSurface={analyticsSurface}
          vault={vault}
          position={withdrawPosition}
          amount={flow.amount}
          chainId={flow.chainId}
          withdrawMode={flow.withdrawMode}
          onBack={onBackToWithdrawAmount}
          onClose={onClose}
          onWithdraw={onClose}
          onExecuteWithdraw={(params) =>
            handleExecuteWithdraw(params, {
              amount: flow.amount,
              currentPosition: position ?? flow.position,
            })
          }
          onExecutionFailure={handleWithdrawExecutionFailure}
        />
      )
    }
  }

  return assertNever(flow)
}

function CenteredModalLoader(): JSX.Element {
  return (
    <Flex alignItems="center" justifyContent="center" minHeight={320}>
      <SpinningLoader color="$neutral2" size={24} />
    </Flex>
  )
}

function CenteredModalBalanceError({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <Flex alignItems="center" justifyContent="center" minHeight={320}>
      <EarnBalanceErrorState onRetry={onRetry} />
    </Flex>
  )
}

function addEarnFailurePopup(kind: 'deposit' | 'withdraw', error: string): void {
  popupRegistry.addPopup({ type: PopupType.Error, error }, `earn-${kind}-failed`, DEFAULT_TXN_DISMISS_MS)
}

function assertNever(value: never): never {
  throw new Error(`Unexpected earn vault modal flow: ${JSON.stringify(value)}`)
}
