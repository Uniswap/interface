import { call, put, take } from 'typed-redux-saga'
import { submitOrder } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { DutchQuoteV2, DutchQuoteV3, PriorityQuote, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { signTypedData } from 'uniswap/src/features/transactions/signing'
import { finalizeTransaction, transactionActions } from 'uniswap/src/features/transactions/slice'
import {
  getBaseTradeAnalyticsProperties,
  getRouteAnalyticsData,
} from 'uniswap/src/features/transactions/swap/analytics'
import { ValidatedPermit } from 'uniswap/src/features/transactions/swap/utils/trade'
import {
  QueuedOrderStatus,
  TransactionOriginType,
  TransactionStatus,
  TransactionTypeInfo,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { getSignerManager } from 'wallet/src/features/wallet/context'

// If the app is closed during the waiting period and then reopened, the saga will resume;
// the order should not be submitted if too much time has passed as it may be stale.
export const ORDER_STALENESS_THRESHOLD = 45 * ONE_SECOND_MS

export interface SubmitUniswapXOrderParams {
  // internal id used for tracking transactions before they're submitted
  txId?: string
  quote: DutchQuoteV2 | DutchQuoteV3 | PriorityQuote
  routing: Routing.DUTCH_V2 | Routing.DUTCH_V3 | Routing.PRIORITY
  permit: ValidatedPermit
  chainId: UniverseChainId
  account: AccountMeta
  typeInfo: TransactionTypeInfo
  analytics: ReturnType<typeof getBaseTradeAnalyticsProperties>
  approveTxHash?: string
  wrapTxHash?: string
  onSuccess: () => void
  onFailure: () => void
}

export function* submitUniswapXOrder(params: SubmitUniswapXOrderParams) {
  const {
    quote,
    routing,
    permit,
    approveTxHash,
    wrapTxHash,
    txId,
    chainId,
    typeInfo,
    account,
    analytics,
    onSuccess,
    onFailure,
  } = params

  const orderHash = quote.orderId

  // Wait for approval and/or wrap transactions to confirm, otherwise order submission will fail.
  let waitingForApproval = Boolean(approveTxHash)
  let waitingForWrap = Boolean(wrapTxHash)

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

    const signerManager = yield* call(getSignerManager)
    const signer = yield* call([signerManager, 'getSignerForAccount'], account)

    const signature = yield* call(signTypedData, permit.domain, permit.types, permit.values, signer)

    yield* call(submitOrder, { signature, quote, routing })
  } catch {
    // In the rare event that submission fails, we update the order status to prompt the user.
    // If the app is closed before this catch block is reached, orderWatcherSaga will handle the failure upon reopening.
    yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.SubmissionFailed }))
    yield* call(onFailure)
    return
  }

  const properties = {
    order_hash: orderHash,
    ...analytics,
    ...getRouteAnalyticsData({ routing }),
  }
  yield* call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, properties)

  yield* put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
  // onSuccess does not need to be wrapped in yield* call() here, but doing so makes it easier to test call ordering in submitOrder.test.ts
  yield* call(onSuccess)
}
