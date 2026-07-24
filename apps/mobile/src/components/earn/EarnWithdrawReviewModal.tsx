import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { renderEarnReviewSheetLayout } from 'src/components/earn/EarnReviewSheetLayout'
import type { EarnWithdrawReviewModalProps } from 'src/components/earn/EarnWithdrawReviewModalState'
import { useEarnExecuteCallback } from 'src/components/earn/hooks/useEarnExecuteCallback'
import { useEarnReviewModalHandlers } from 'src/components/earn/hooks/useEarnReviewModalHandlers'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { applyEarnPositionChangeOptimistically } from 'uniswap/src/features/earn/optimisticEarnPositions'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { WithdrawReviewView, type ExecuteEarnWithdrawParams } from 'uniswap/src/features/earn/WithdrawReviewView'
import { useLocalFiatToUSDConverter } from 'uniswap/src/features/fiatCurrency/useLocalFiatToUSDConverter'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useActiveAddress } from 'wallet/src/features/accounts/store/hooks'

export function EarnWithdrawReviewModal({
  analyticsEntryPoint,
  vault,
  position,
  amount,
  chainId,
  destinationCurrencyId,
  startedAnalyticsKey,
  withdrawMode,
  isOpen,
  onClose,
}: EarnWithdrawReviewModalProps & BaseModalProps): JSX.Element | null {
  // Capture navigation outside the bottom-sheet portal; portal navigation may miss `replace`.
  const navigation = useAppStackNavigation()
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
      initialAction: EarnAction.Withdraw,
      initialChainId: chainId,
      initialAmount: amount,
      initialWithdrawMode: withdrawMode,
      startedAnalyticsKey,
    })
  }, [analyticsEntryPoint, amount, chainId, navigation, position, startedAnalyticsKey, vault, withdrawMode])

  const handleExecuteWithdraw = useCallback(
    (params: ExecuteEarnWithdrawParams) => {
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
            action: EarnAction.Withdraw,
            amount: amount ?? '0',
            currentPosition: position,
            localFiatToUsd,
            queryClient,
            vault,
            walletAddress: evmAddress ?? undefined,
            withdrawMode: params.withdrawMode,
          })
        },
      })
    },
    [amount, evmAddress, executeEarn, localFiatToUsd, position, queryClient, setHasExecutionError, vault],
  )

  if (!vault || !position || amount === undefined || chainId === undefined) {
    return null
  }

  return (
    // overrideInnerContainer: the review layout renders its own BottomSheetView so the action row
    // can live in a pinned footer overlay (see renderEarnReviewSheetLayout).
    <Modal overrideInnerContainer name={ModalName.EarnWithdrawReview} isModalOpen={isOpen} onClose={handleClose}>
      <WithdrawReviewView
        renderLayout={renderEarnReviewSheetLayout}
        analyticsEntryPoint={analyticsEntryPoint}
        analyticsSurface="mobile"
        vault={vault}
        position={position}
        amount={amount}
        chainId={chainId}
        destinationCurrencyId={destinationCurrencyId}
        withdrawMode={withdrawMode}
        onBack={handleBack}
        onClose={handleClose}
        onWithdraw={handleClose}
        onExecuteWithdraw={handleExecuteWithdraw}
        onExecutionFailure={handleExecutionFailure}
      />
    </Modal>
  )
}
