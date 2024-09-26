import { call, put, take } from 'typed-redux-saga'
import { submitOrder } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { OrderRequest, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { finalizeTransaction, transactionActions } from 'uniswap/src/features/transactions/slice'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import {
  QueuedOrderStatus,
  TransactionOriginType,
  TransactionStatus,
  TransactionTypeInfo,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { WalletChainId } from 'uniswap/src/types/chains'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'

// If the app is closed during the waiting period and then reopened, the saga will resume;
// the order should not be submitted if too much time has passed as it may be stale.
export const ORDER_STALENESS_THRESHOLD = 45 * ONE_SECOND_MS

export interface SubmitUniswapXOrderParams {
  // internal id used for tracking transactions before they're submitted
  txId?: string
  chainId: WalletChainId
  orderParams: OrderRequest
  account: AccountMeta
  typeInfo: TransactionTypeInfo
  analytics: ReturnType<typeof getBaseTradeAnalyticsProperties>
  approveTxHash?: string
  wrapTxHash?: string
  onSubmit: () => void
  onFailure: () => void
}

export function* submitUniswapXOrder(params: SubmitUniswapXOrderParams) {
  const { orderParams, approveTxHash, wrapTxHash, txId, chainId, typeInfo, account, analytics, onSubmit, onFailure } =
    params

  // Wait for approval and/or wrap transactions to confirm, otherwise order submission will fail.
  let waitingForApproval = Boolean(approveTxHash)
  let waitingForWrap = Boolean(wrapTxHash)

  const orderHash = orderParams.quote.orderId
  const order = {
    routing: Routing.DUTCH_V2,
    orderHash,
    id: txId ?? createTransactionId(),
    chainId,
    typeInfo,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
    queueStatus: QueuedOrderStatus.Waiting,
    transactionOriginType: TransactionOriginType.Internal,
  } satisfies UniswapXOrderDetails

  yield* put(transactionActions.addTransaction(order))
  logger.debug('submitOrder', 'addOrder', 'order added:', { chainId, orderHash, ...typeInfo })

  const waitStartTime = Date.now()

  // Wait for approval and/or wrap
  while (waitingForApproval || waitingForWrap) {
    const { payload } = yield* take<ReturnType<typeof finalizeTransaction>>(finalizeTransaction.type)

    if (Date.now() - waitStartTime > ORDER_STALENESS_THRESHOLD) {
      yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.Stale }))
      yield* call(onFailure)
      return
    }

    if (payload.hash === approveTxHash) {
      if (payload.status !== TransactionStatus.Success) {
        yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.ApprovalFailed }))
        yield* call(onFailure)
        return
      }
      waitingForApproval = false
    } else if (payload.hash === wrapTxHash) {
      if (payload.status !== TransactionStatus.Success) {
        yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.WrapFailed }))
        yield* call(onFailure)
        return
      }
      waitingForWrap = false
    }
  }

  // Submit transaction
  try {
    const addedTime = Date.now() // refresh the addedTime to match the actual submission time
    yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.Submitted, addedTime }))
    yield* call(submitOrder, orderParams)
  } catch {
    // In the rare event that submission fails, we update the order status to prompt the user.
    // If the app is closed before this catch block is reached, orderWatcherSaga will handle the failure upon reopening.
    yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.SubmissionFailed }))
    yield* call(onFailure)
    return
  }

  const properties = { routing: order.routing, order_hash: orderHash, ...analytics }
  yield* call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, properties)

  yield* put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
  // onSubmit does not need to be wrapped in yield* call() here, but doing so makes it easier to test call ordering in submitOrder.test.ts
  yield* call(onSubmit)
}
