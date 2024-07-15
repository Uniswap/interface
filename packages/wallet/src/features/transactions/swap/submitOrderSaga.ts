import axios from 'axios'
import { call, put, take } from 'typed-redux-saga'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { OrderRequest, Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { finalizeTransaction, transactionActions } from 'wallet/src/features/transactions/slice'
import { getBaseTradeAnalyticsProperties } from 'wallet/src/features/transactions/swap/analytics'
import { TRADING_API_HEADERS } from 'wallet/src/features/transactions/swap/trade/api/client'
import {
  QueuedOrderStatus,
  TransactionStatus,
  TransactionTypeInfo,
  UniswapXOrderDetails,
} from 'wallet/src/features/transactions/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'

// If the app is closed during the waiting period and then reopened, the saga will resume;
// the order should not be submitted if too much time has passed as it may be stale.
const ORDER_STALENESS_THRESHOLD = 45 * ONE_SECOND_MS

interface SubmitUniswapXOrderParams {
  // internal id used for tracking transactions before they're submitted
  txId?: string
  chainId: WalletChainId
  orderParams: OrderRequest
  account: Account
  typeInfo: TransactionTypeInfo
  analytics: ReturnType<typeof getBaseTradeAnalyticsProperties>
  approveTxHash?: string
  wrapTxHash?: string
  onSubmit: () => void
  onFailure: () => void
}

const ORDER_ENDPOINT = uniswapUrls.tradingApiUrl + uniswapUrls.tradingApiPaths.order

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
    wrapTxHash,
  } satisfies UniswapXOrderDetails

  yield* put(transactionActions.addTransaction(order))
  logger.debug('submitOrder', 'addOrder', 'order added:', { chainId, orderHash, ...typeInfo })

  const waitStartTime = Date.now()

  // Wait for approval and/or wrap
  while (waitingForApproval || waitingForWrap) {
    const { payload } = yield* take<ReturnType<typeof finalizeTransaction>>(finalizeTransaction.type)

    if (Date.now() - waitStartTime > ORDER_STALENESS_THRESHOLD) {
      yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.Stale }))
      return
    }

    if (payload.hash === approveTxHash) {
      if (payload.status !== TransactionStatus.Success) {
        yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.ApprovalFailed }))
        onFailure()
        return
      }
      waitingForApproval = false
    } else if (payload.hash === wrapTxHash) {
      if (payload.status !== TransactionStatus.Success) {
        yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.WrapFailed }))
        onFailure()
        return
      }
      waitingForWrap = false
    }
  }

  // Submit transaction
  try {
    const addedTime = Date.now() // refresh the addedTime to match the actual submission time
    yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.Submitted, addedTime }))
    yield* call(axios.post, ORDER_ENDPOINT, orderParams, { headers: TRADING_API_HEADERS })
  } catch {
    // In the rare event that submission fails, we update the order status to prompt the user.
    // If the app is closed before this catch block is reached, orderWatcherSaga will handle the failure upon reopening.
    yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.SubmissionFailed }))
    onFailure()
    return
  }

  const properties = { routing: order.routing, order_hash: orderHash, ...analytics }
  yield* call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, properties)

  onSubmit()
}
