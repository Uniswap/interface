import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import type { EarnDepositReviewModalProps } from 'src/components/earn/EarnDepositReviewModalState'
import { renderEarnReviewSheetLayout } from 'src/components/earn/EarnReviewSheetLayout'
import { useEarnExecuteCallback } from 'src/components/earn/hooks/useEarnExecuteCallback'
import { useEarnReviewModalHandlers } from 'src/components/earn/hooks/useEarnReviewModalHandlers'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { permanentlyDismissEarnSwapUpsell } from 'uniswap/src/features/behaviorHistory/slice'
import { DepositReviewView, type ExecuteEarnDepositParams } from 'uniswap/src/features/earn/DepositReviewView'
import { applyEarnPositionChangeOptimistically } from 'uniswap/src/features/earn/optimisticEarnPositions'
import { getValidEarnSwapUpsellCurrencyId } from 'uniswap/src/features/earn/swapUpsell'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { useLocalFiatToUSDConverter } from 'uniswap/src/features/fiatCurrency/useLocalFiatToUSDConverter'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useActiveAddress } from 'wallet/src/features/accounts/store/hooks'

export function EarnDepositReviewModal({
  analyticsEntryPoint,
  vault,
  position,
  amount,
  tokenAmount,
  originatingTransactionId,
  projectedMonthlyEarningsUsd,
  sourceCurrencyId,
  sourceUpsellCurrencyId,
  startedAnalyticsKey,
  swapAmountUsd,
  isOpen,
  onClose,
}: EarnDepositReviewModalProps & BaseModalProps): JSX.Element | null {
  // Capture navigation outside the bottom-sheet portal; portal navigation may miss `replace`.
  const navigation = useAppStackNavigation()
  const dispatch = useDispatch()
  const executeEarn = useEarnExecuteCallback()
  const queryClient = useQueryClient()
  const localFiatToUsd = useLocalFiatToUSDConverter()
  const evmAddress = useActiveAddress(Platform.EVM)
  const { setHasExecutionError, handleExecutionFailure, handleClose } = useEarnReviewModalHandlers({ onClose })

  const handleBack = useCallback(() => {
    if (!vault) {
      return
    }
    // Review replaced the amount sheet, so back replaces review with amount.
    navigation.replace(ModalName.EarnDepositAmount, {
      analyticsEntryPoint,
      vault,
      position,
      initialAction: EarnAction.Deposit,
      initialAmount: amount,
      initialSourceCurrencyId: sourceCurrencyId,
      originatingTransactionId,
      projectedMonthlyEarningsUsd,
      sourceUpsellCurrencyId,
      startedAnalyticsKey,
      swapAmountUsd,
    })
  }, [
    analyticsEntryPoint,
    amount,
    navigation,
    originatingTransactionId,
    position,
    projectedMonthlyEarningsUsd,
    sourceCurrencyId,
    sourceUpsellCurrencyId,
    startedAnalyticsKey,
    swapAmountUsd,
    vault,
  ])

  const handleExecuteDeposit = useCallback(
    (params: ExecuteEarnDepositParams) => {
      setHasExecutionError(false)
      executeEarn({
        ...params,
        onPlanFinalized: (finalizedParams) => {
          params.onPlanFinalized?.(finalizedParams)

          if (finalizedParams.status !== TransactionStatus.Success) {
            return
          }
          setHasExecutionError(false)

          applyEarnPositionChangeOptimistically({
            action: EarnAction.Deposit,
            amount: amount ?? '0',
            currentPosition: position,
            localFiatToUsd,
            queryClient,
            vault,
            walletAddress: evmAddress ?? undefined,
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
        },
      })
    },
    [
      amount,
      dispatch,
      evmAddress,
      executeEarn,
      localFiatToUsd,
      position,
      queryClient,
      setHasExecutionError,
      sourceUpsellCurrencyId,
      vault,
    ],
  )

  if (!vault || amount === undefined) {
    return null
  }

  return (
    // overrideInnerContainer: the review layout renders its own BottomSheetView so the action row
    // can live in a pinned footer overlay (see renderEarnReviewSheetLayout).
    <Modal overrideInnerContainer name={ModalName.EarnDepositReview} isModalOpen={isOpen} onClose={handleClose}>
      <DepositReviewView
        renderLayout={renderEarnReviewSheetLayout}
        analyticsEntryPoint={analyticsEntryPoint}
        analyticsSurface="mobile"
        vault={vault}
        position={position}
        amount={amount}
        tokenAmount={tokenAmount}
        originatingTransactionId={originatingTransactionId}
        projectedMonthlyEarningsUsd={projectedMonthlyEarningsUsd}
        sourceCurrencyId={sourceCurrencyId ?? vault.currencyId}
        sourceUpsellCurrencyId={sourceUpsellCurrencyId}
        swapAmountUsd={swapAmountUsd}
        onBack={handleBack}
        onClose={handleClose}
        onDeposit={handleClose}
        onExecuteDeposit={handleExecuteDeposit}
        onExecutionFailure={handleExecutionFailure}
      />
    </Modal>
  )
}
