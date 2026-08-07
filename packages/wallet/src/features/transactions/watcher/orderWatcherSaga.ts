import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { call, delay, fork, put, select, take } from 'typed-redux-saga'
import { evaluateCancelState } from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import { makeSelectUniswapXOrder } from 'uniswap/src/features/transactions/selectors'
import { stampOrphanCancelTimeout, updateTransaction } from 'uniswap/src/features/transactions/slice'
import { getOrders } from 'uniswap/src/features/transactions/swap/orders'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  QueuedOrderStatus,
  TransactionStatus,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTxStatus } from 'uniswap/src/features/transactions/types/utils'
import { convertOrderStatusToTransactionStatus } from 'uniswap/src/features/transactions/utils/uniswapX.utils'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// If the backend cannot provide a status for an order, we can assume after a certain threshold the submission failed.
const ORDER_TIMEOUT_BUFFER = 20 * ONE_SECOND_MS

/**
 * Pure per-order update decision for the poll loop (extracted for testability).
 * Returns the updated order to store, or undefined when no update should be applied.
 *
 * Guard: orders in the cancel flow (`status === Cancelling`, strictly) exit only to FINAL
 * statuses — non-final backend statuses (OPEN, INSUFFICIENT_FUNDS) must never flick a
 * `Cancelling` order back to a cancellable state mid-cancel.
 */
export function getOrderUpdate({
  localOrder,
  remoteOrder,
}: {
  localOrder: UniswapXOrderDetails
  remoteOrder: TradingApi.UniswapXOrder
}): UniswapXOrderDetails | undefined {
  const updatedStatus = convertOrderStatusToTransactionStatus(remoteOrder.orderStatus)

  const isUnchanged = updatedStatus === localOrder.status
  const isFinal = isFinalizedTxStatus(updatedStatus)
  const inCancelFlow = localOrder.status === TransactionStatus.Cancelling

  // Ignore non-final order statuses if the tx is being cancelled locally; the backend is not yet aware of cancellation
  if (isUnchanged || (inCancelFlow && !isFinal)) {
    return undefined
  }

  return {
    ...localOrder,
    status: updatedStatus,
    hash: remoteOrder.txHash,
    // The cancellation raced a fill and lost: the order succeeded, the cancellation did not apply
    ...(inCancelFlow && updatedStatus === TransactionStatus.Success ? { cancelFailedReason: 'filled' as const } : {}),
  }
}

export class OrderWatcher {
  private static listeners: {
    [orderHash: string]: {
      updateOrderStatus: (updatedOrder: UniswapXOrderDetails) => void
      promise: Promise<UniswapXOrderDetails>
    }
  } = {}

  // There is an issue on extension where the sagas are initialized multiple times.
  // The first instance of this polling utility will not have access to the latest store.
  // As a temporary fix, we can use an index to track & cancel the previous instance of the polling utility.
  private static index = 0;

  static *initialize(): Generator<unknown> {
    OrderWatcher.index++
    yield* fork(OrderWatcher.poll, OrderWatcher.index)
  }

  private static *poll(index: number): Generator<unknown> {
    if (index !== OrderWatcher.index) {
      return
    }

    yield* delay(2000) // Poll at 2s intervals

    const orderHashes = Object.keys(OrderWatcher.listeners)
    if (!orderHashes.length) {
      yield* fork(OrderWatcher.poll, index)
      return
    }

    try {
      const data = yield* call(getOrders, orderHashes)
      const remoteOrderMap = new Map(data.orders.map((order: TradingApi.UniswapXOrder) => [order.orderId, order]))
      const isCancelTrackingEnabled = getFeatureFlag(FeatureFlags.LimitCancelTimeout)

      for (const localOrderHash of orderHashes) {
        const remoteOrder = remoteOrderMap.get(localOrderHash)
        const selectUniswapXOrder = yield* call(makeSelectUniswapXOrder)
        const localOrder = yield* select(selectUniswapXOrder, { orderHash: localOrderHash })

        if (!localOrder?.orderHash) {
          continue
        }

        // If submission fails, stop polling for this order.
        if (localOrder.queueStatus === QueuedOrderStatus.SubmissionFailed) {
          delete OrderWatcher.listeners[localOrder.orderHash]
          continue
        }

        // If the backend does not have data for an order marked locally as submitted and enough time has
        // passed, we can assume the submission call to the tradingAPI failed and update state accordingly
        if (!remoteOrder) {
          if (Date.now() - localOrder.addedTime > ORDER_TIMEOUT_BUFFER) {
            OrderWatcher.listeners[localOrderHash]?.updateOrderStatus({
              ...localOrder,
              queueStatus: QueuedOrderStatus.SubmissionFailed,
            })
            delete OrderWatcher.listeners[localOrder.orderHash]
          }
          continue
        }

        // Cancel-timeout machine tick: keys exclusively off the persisted cancel fields, so
        // Dutch/Priority orders without them can never mis-fire. Terminal backend statuses are
        // converged by the normal update decision below; the alert arm has no wallet UI yet.
        if (isCancelTrackingEnabled && localOrder.status === TransactionStatus.Cancelling) {
          const evaluation = evaluateCancelState({
            order: localOrder,
            freshBackendStatus: remoteOrder.orderStatus,
            // The tracked cancel tx is watched by the classic pipeline on this stack; receipts
            // arrive via the finalization listener, so the one-shot receipt fetch is skipped.
            cancelTxReceiptStatus: localOrder.cancelTxHash ? 'not-found' : undefined,
            nowMs: Date.now(),
          })
          if (evaluation.kind === 'stamp-orphan-timeout') {
            yield* put(
              stampOrphanCancelTimeout({
                address: localOrder.from,
                chainId: localOrder.chainId,
                id: localOrder.id,
                nowMs: Date.now(),
              }),
            )
          }
        }

        const updatedOrder = getOrderUpdate({ localOrder, remoteOrder })
        if (!updatedOrder) {
          continue
        }

        OrderWatcher.listeners[localOrder.orderHash]?.updateOrderStatus(updatedOrder)
        delete OrderWatcher.listeners[localOrder.orderHash]
      }
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'orderWatcherSaga',
          function: 'orderWatcher',
        },
      })
    }

    yield* fork(OrderWatcher.poll, index)
  }

  // oxlint-disable-next-line typescript/explicit-function-return-type
  static *waitForOrderStatus(orderHash: string, queueStatus: QueuedOrderStatus) {
    // Avoid polling until the order has been submitted
    if (queueStatus !== QueuedOrderStatus.Submitted) {
      while (true) {
        const { payload } = yield* take<ReturnType<typeof updateTransaction>>(updateTransaction.type)
        if (
          isUniswapX(payload) &&
          payload.orderHash === orderHash &&
          payload.queueStatus === QueuedOrderStatus.Submitted
        ) {
          // The submission update also forks a fresh watcher for this order (transactionWatcherSaga
          // re-arms on every updateTransaction), and that watcher owns the fill. Exit instead of
          // joining the same listener promise — otherwise both watchers resolve together and
          // finalize the order twice, double-logging Swap Transaction Completed.
          return undefined
        }
      }
    }

    const existingListenerPromise = OrderWatcher.listeners[orderHash]?.promise
    if (existingListenerPromise) {
      return yield* call(() => existingListenerPromise)
    }

    let resolvePromise: (value: UniswapXOrderDetails) => void
    const promise = new Promise<UniswapXOrderDetails>((resolve) => {
      resolvePromise = resolve
    })
    // oxlint-disable-next-line typescript/no-non-null-assertion -- Safe assertion in test or migration context -- Must appease typechecker since resolvePromise is assigned inside promise scope
    OrderWatcher.listeners[orderHash] = { updateOrderStatus: resolvePromise!, promise }

    return yield* call(() => promise)
  }
}
