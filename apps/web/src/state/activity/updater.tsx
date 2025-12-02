import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import { useHandleUniswapXActivityUpdate } from 'hooks/useHandleUniswapXActivityUpdate'
import { useCallback } from 'react'
import { usePollPendingBatchTransactions } from 'state/activity/polling/batch'
import { usePollPendingBridgeTransactions } from 'state/activity/polling/bridge'
import { usePollPendingOrders } from 'state/activity/polling/orders'
import { usePollPendingTransactions } from 'state/activity/polling/transactions'
import { type ActivityUpdate, ActivityUpdateTransactionType, type OnActivityUpdate } from 'state/activity/types'
import { useAppDispatch } from 'state/hooks'
import { logSwapFinalized } from 'tracing/swapFlowLoggers'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import {
  finalizeTransaction,
  interfaceApplyTransactionHashToBatch,
  interfaceConfirmBridgeDeposit,
  updateTransaction,
} from 'uniswap/src/features/transactions/slice'
import { isNonInstantFlashblockTransactionType } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { getIsFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import {
  type InterfaceTransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx } from 'uniswap/src/features/transactions/types/utils'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function ActivityStateUpdater() {
  const onActivityUpdate = useOnActivityUpdate()
  return (
    <>
      {/* The polling updater is present to update activity states for chains that are not supported by the subscriptions service. */}
      <PollingActivityStateUpdater onActivityUpdate={onActivityUpdate} />
    </>
  )
}

function PollingActivityStateUpdater({ onActivityUpdate }: { onActivityUpdate: OnActivityUpdate }) {
  usePollPendingTransactions(onActivityUpdate)
  usePollPendingBatchTransactions(onActivityUpdate)
  usePollPendingBridgeTransactions(onActivityUpdate)
  usePollPendingOrders(onActivityUpdate)
  return null
}

function useOnActivityUpdate(): OnActivityUpdate {
  const dispatch = useAppDispatch()
  const analyticsContext = useTrace()
  const handleUniswapXActivityUpdate = useHandleUniswapXActivityUpdate()

  return useCallback(
    (activity: ActivityUpdate) => {
      const popupDismissalTime = isL2ChainId(activity.chainId) ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      const { chainId } = activity

      if (activity.type === ActivityUpdateTransactionType.BaseTransaction) {
        const { original, update } = activity

        // TODO(WEB-7631): Make batch handling explicit
        if (original.batchInfo && update.hash) {
          dispatch(
            interfaceApplyTransactionHashToBatch({
              batchId: original.batchInfo.batchId,
              chainId,
              hash: update.hash,
              address: original.from,
            }),
          )
        }

        const hash = update.hash ?? original.hash

        // If a bridging deposit transaction is successful, we update `depositConfirmed`but keep activity pending until the cross-chain bridge transaction confirm in bridge.ts
        if (
          original.typeInfo.type === TransactionType.Bridge &&
          !original.typeInfo.depositConfirmed &&
          update.status === TransactionStatus.Success
        ) {
          dispatch(interfaceConfirmBridgeDeposit({ chainId, id: original.id, address: original.from, ...update }))
          return
        }

        // Bridge transactions that have been confirmed on the deposit side are finalized differently
        // They complete cross-chain and don't have traditional receipts when successful
        const isBridgeWithDepositConfirmed =
          original.typeInfo.type === TransactionType.Bridge && original.typeInfo.depositConfirmed

        // Batch transactions that are confirmed also don't have traditional receipts
        const isBatchTransactionConfirmed = Boolean(original.batchInfo && update.hash)

        // For successful bridge transactions with deposit confirmed or confirmed batch transactions, we don't require a receipt
        // For all other transactions (including failed bridges), we need a receipt to finalize
        const receipt = update.receipt
        const canFinalizeWithoutReceipt =
          (isBridgeWithDepositConfirmed || isBatchTransactionConfirmed) && update.status === TransactionStatus.Success

        if (!receipt && !canFinalizeWithoutReceipt) {
          // We should not finalize a transaction without a confirmed receipt (except for successful bridge and batch transactions)
          return
        }

        const updatedTransaction: InterfaceTransactionDetails = {
          ...original,
          typeInfo: update.typeInfo,
          receipt,
          networkFee: update.networkFee ?? original.networkFee,
          status: update.status,
          hash,
        }

        if (!isFinalizedTx(updatedTransaction)) {
          // Log the validation failure instead of throwing an error
          // This prevents the transaction from being missed completely
          logger.error('Transaction validation failed - missing required fields for finalization', {
            tags: { file: 'updater.tsx', function: 'useOnActivityUpdate' },
            extra: {
              transactionId: original.id,
              hash,
              status: update.status,
              hasReceipt: !!receipt,
              transaction: updatedTransaction,
            },
          })

          // Update transaction with any relevant changes
          dispatch(updateTransaction(updatedTransaction))

          // Return early to continue checking for this transaction
          return
        }

        dispatch(finalizeTransaction(updatedTransaction))

        const batchId = original.batchInfo?.batchId

        if (original.typeInfo.type === TransactionType.Swap) {
          logSwapFinalized({
            id: original.id,
            hash,
            batchId,
            chainInId: chainId,
            chainOutId: chainId,
            analyticsContext,
            status: update.status,
            type: original.typeInfo.type,
            isFinalStep: original.typeInfo.isFinalStep,
            swapStartTimestamp: original.typeInfo.swapStartTimestamp,
          })
        } else if (original.typeInfo.type === TransactionType.Bridge) {
          logSwapFinalized({
            id: original.id,
            hash,
            batchId,
            chainInId: currencyIdToChain(original.typeInfo.inputCurrencyId) ?? chainId,
            chainOutId: currencyIdToChain(original.typeInfo.outputCurrencyId) ?? chainId,
            analyticsContext,
            status: update.status,
            type: original.typeInfo.type,
            isFinalStep: original.typeInfo.isFinalStep,
            swapStartTimestamp: original.typeInfo.swapStartTimestamp,
          })
        }

        // Check if this is a flashblock transaction that should skip notifications
        const isUnichainFlashblock = getIsFlashblocksEnabled(chainId)
        const shouldShowPopup =
          !isUnichainFlashblock ||
          isNonInstantFlashblockTransactionType(original) ||
          !('isFlashblockTxWithinThreshold' in original) ||
          !original.isFlashblockTxWithinThreshold

        if (shouldShowPopup && hash) {
          popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)
        }
        // TransactionType can only be UniswapXOrder here
        // This check is in place in case more types get added in the future
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (activity.type === ActivityUpdateTransactionType.UniswapXOrder) {
        handleUniswapXActivityUpdate({ activity, popupDismissalTime })
      }
    },
    [analyticsContext, dispatch, handleUniswapXActivityUpdate],
  )
}
