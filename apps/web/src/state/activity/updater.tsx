import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback } from 'react'
import { usePollPendingBatchTransactions } from 'state/activity/polling/batch'
import { usePollPendingBridgeTransactions } from 'state/activity/polling/bridge'
import { usePollPendingOrders } from 'state/activity/polling/orders'
import { usePollPendingTransactions } from 'state/activity/polling/transactions'
import type { ActivityUpdate, OnActivityUpdate } from 'state/activity/types'
import { getRoutingForUniswapXOrder } from 'state/activity/utils'
import { useAppDispatch } from 'state/hooks'
import { updateSignature } from 'state/signatures/reducer'
import { SignatureType } from 'state/signatures/types'
import { logSwapFinalized, logUniswapXSwapFinalized } from 'tracing/swapFlowLoggers'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import {
  addTransaction,
  finalizeTransaction,
  interfaceApplyTransactionHashToBatch,
  interfaceConfirmBridgeDeposit,
  updateTransaction,
} from 'uniswap/src/features/transactions/slice'
import { isNonInstantFlashblockTransactionType } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { getIsFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import {
  InterfaceTransactionDetails,
  TransactionOriginType,
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

  return useCallback(
    (activity: ActivityUpdate) => {
      const popupDismissalTime = isL2ChainId(activity.chainId) ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      if (activity.type === 'transaction') {
        const { chainId, original, update } = activity

        // TODO(WEB-7631): Make batch handling explicit
        if (activity.original.batchInfo && update.hash) {
          dispatch(
            interfaceApplyTransactionHashToBatch({
              batchId: activity.original.batchInfo.batchId,
              chainId,
              hash: update.hash,
              address: activity.original.from,
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

        if (!('receipt' in update) || !update.receipt) {
          // We should not finalize a transaction without a confirmed receipt
          return
        }

        const receipt = update.receipt

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
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (activity.type === 'signature') {
        const { chainId, original, update } = activity

        // Return early if the order is already filled
        if (original.status === UniswapXOrderStatus.FILLED) {
          return
        }

        const updatedOrder = { ...original, ...update }
        dispatch(updateSignature(updatedOrder))

        // SignatureDetails.type should not be typed as optional, but this will be fixed when we merge activity for uniswap. The default value appeases the typechecker.
        const signatureType = updatedOrder.type ?? SignatureType.SIGN_UNISWAPX_V2_ORDER

        if (updatedOrder.status === UniswapXOrderStatus.FILLED) {
          const hash = updatedOrder.txHash
          const from = original.offerer

          const transaction: InterfaceTransactionDetails = {
            chainId,
            from,
            id: hash,
            hash,
            typeInfo: updatedOrder.swapInfo,
            routing: getRoutingForUniswapXOrder(updatedOrder),
            transactionOriginType: TransactionOriginType.Internal,
            status: TransactionStatus.Success,
            addedTime: Date.now(),
            options: { request: {} }, // Not used in web currently
          }
          dispatch(addTransaction(transaction))
          popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)

          // Only track swap success for non-limit orders; limit order fill-time will throw off time tracking analytics
          if (original.type !== SignatureType.SIGN_LIMIT) {
            logUniswapXSwapFinalized({
              id: original.id,
              hash,
              orderHash: updatedOrder.orderHash,
              chainId,
              analyticsContext,
              signatureType,
              status: UniswapXOrderStatus.FILLED,
            })
          }
        } else if (original.status !== updatedOrder.status) {
          const orderHash = original.orderHash
          popupRegistry.addPopup({ type: PopupType.Order, orderHash }, orderHash, popupDismissalTime)

          if (
            updatedOrder.status === UniswapXOrderStatus.CANCELLED ||
            updatedOrder.status === UniswapXOrderStatus.EXPIRED
          ) {
            logUniswapXSwapFinalized({
              id: original.id,
              hash: undefined,
              orderHash: updatedOrder.orderHash,
              chainId,
              analyticsContext,
              signatureType,
              status: updatedOrder.status,
            })
          }
        }
      }
    },
    [analyticsContext, dispatch],
  )
}
