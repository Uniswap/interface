import axios from 'axios'
import { call, delay, fork, select, take } from 'typed-redux-saga'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { GetOrdersResponse } from 'wallet/src/data/tradingApi/__generated__/index'
import { makeSelectUniswapXOrder } from 'wallet/src/features/transactions/selectors'
import { updateTransaction } from 'wallet/src/features/transactions/slice'
import { TRADING_API_HEADERS } from 'wallet/src/features/transactions/swap/trade/api/client'
import { ORDER_STATUS_TO_TX_STATUS } from 'wallet/src/features/transactions/swap/trade/api/utils'
import { isUniswapX } from 'wallet/src/features/transactions/swap/trade/utils'
import {
  QueuedOrderStatus,
  TransactionStatus,
  UniswapXOrderDetails,
  isFinalizedTxStatus,
} from 'wallet/src/features/transactions/types'

// If the backend cannot provide a status for an order, we can assume after a certain threshold the submission failed.
const ORDER_TIMEOUT_BUFFER = 20 * ONE_SECOND_MS

export async function getOrders(orderIds: string[]): Promise<GetOrdersResponse> {
  const orderIdsString = orderIds.join(',')
  const ordersEndpoint = uniswapUrls.tradingApiUrl + uniswapUrls.tradingApiPaths.orders
  const urlParams = `?orderIds=${encodeURIComponent(orderIdsString)}`

  return (await axios.get(ordersEndpoint + urlParams, { headers: TRADING_API_HEADERS })).data as GetOrdersResponse
}

const selectUniswapXOrder = makeSelectUniswapXOrder()

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
  private static index = 0

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
      const remoteOrderMap = new Map(data.orders.map((order) => [order.orderId, order]))

      for (const localOrderHash of orderHashes) {
        const remoteOrder = remoteOrderMap.get(localOrderHash)
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

        const updatedStatus = ORDER_STATUS_TO_TX_STATUS[remoteOrder.orderStatus]

        const isUnchanged = updatedStatus === localOrder?.status
        const isFinal = isFinalizedTxStatus(updatedStatus)

        // Ignore non-final order statuses if the tx is being cancelled locally; the backend is not yet aware of cancellation
        const isOngoingCancel = !isFinal && localOrder?.status === TransactionStatus.Cancelling

        if (isUnchanged || isOngoingCancel) {
          continue
        }

        OrderWatcher.listeners[localOrder.orderHash]?.updateOrderStatus({
          ...localOrder,
          status: updatedStatus,
          hash: remoteOrder.txHash,
        })
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
          break
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Must appease typechecker since resolvePromise is assigned inside promise scope
    OrderWatcher.listeners[orderHash] = { updateOrderStatus: resolvePromise!, promise }

    return yield* call(() => promise)
  }
}
