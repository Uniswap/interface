import { orderCancelFailed, orderCancelTxMined, TransactionsState } from 'uniswap/src/features/transactions/slice'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  InterfaceTransactionDetails,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export type CancelTxFinalizationUpdate = ReturnType<typeof orderCancelTxMined> | ReturnType<typeof orderCancelFailed>

function findLinkedOrders({
  transactionsState,
  address,
  orderHashes,
}: {
  transactionsState: TransactionsState
  address: string
  orderHashes: string[]
}): UniswapXOrderDetails[] {
  const orders: UniswapXOrderDetails[] = []
  const chainIdToTxs = transactionsState[address]
  if (!chainIdToTxs) {
    return orders
  }
  for (const txs of Object.values(chainIdToTxs)) {
    for (const tx of Object.values(txs)) {
      if (isUniswapX(tx) && tx.orderHash && orderHashes.includes(tx.orderHash)) {
        orders.push(tx)
      }
    }
  }
  return orders
}

/**
 * Pure core of the cancel-tx finalization listeners (web saga + wallet saga): given a finalized
 * transaction, computes the order-flip dispatches for the UniswapX orders it cancels.
 *
 * Rules (idempotent and re-entrant):
 * - Cancel tx finalized `Canceled`/`Success`: mark each linked order's cancel tx mined ONLY —
 *   never finalize the order from a receipt (fill-biased same-block adjudication stays with the
 *   backend; also the single-fire guarantee for `SwapTransactionCancelled`).
 * - Cancel tx finalized `Failed`: revert each linked order to `Pending` only if it is still
 *   `Cancelling` AND the OR-gate is met — the failure carries a real receipt (the cancel tx
 *   mined and reverted on-chain; safe to converge immediately) OR the order-level timeout has
 *   expired. The receipt arm matters because the classic pipeline can also force-fail a tx
 *   after poll exhaustion WITHOUT a receipt, and a spawned receipt backfill may later correct
 *   that to `Canceled` (see watchTransactionSaga) — the gate plus `orderCancelTxMined`'s
 *   re-entrancy kills the "permanently fake-Pending order with a consumed nonce" hazard.
 * - Orders already final (e.g. `Success` = filled) are never flipped (CAS in the reducers).
 */
export function getCancelTxFinalizationUpdates({
  transaction,
  transactionsState,
  nowMs,
}: {
  transaction: TransactionDetails | InterfaceTransactionDetails
  transactionsState: TransactionsState
  nowMs: number
}): CancelTxFinalizationUpdate[] {
  if (transaction.typeInfo.type !== TransactionType.UniswapXCancel) {
    return []
  }

  const { orderHashes } = transaction.typeInfo
  const orders = findLinkedOrders({ transactionsState, address: transaction.from, orderHashes })
  const updates: CancelTxFinalizationUpdate[] = []

  for (const order of orders) {
    const orderId = { address: order.from, chainId: order.chainId, id: order.id }

    switch (transaction.status) {
      case TransactionStatus.Canceled:
      case TransactionStatus.Success:
        // The reducer no-ops for final orders and re-marks reverted (`Pending`/`InsufficientFunds`)
        // orders back toward cancelled — a late receipt means the order's nonce is consumed.
        updates.push(orderCancelTxMined(orderId))
        break
      case TransactionStatus.Failed: {
        // A receipt on the finalized payload = mined-and-reverted for real; no receipt = possible
        // poll-exhaustion force-fail, so wait out the order-level deadline before reverting
        const minedAndReverted = Boolean(transaction.receipt)
        const timeoutExpired = order.cancelTimeoutAtMs != null && nowMs > order.cancelTimeoutAtMs
        if (
          order.status === TransactionStatus.Cancelling &&
          !order.cancelTxMined &&
          (minedAndReverted || timeoutExpired)
        ) {
          updates.push(
            orderCancelFailed({ ...orderId, reason: 'broadcast-failed', revertToStatus: TransactionStatus.Pending }),
          )
        }
        break
      }
      default:
        break
    }
  }

  return updates
}
