import { TradingApi } from '@universe/api'
import { call, put } from 'typed-redux-saga'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { signTypedData } from 'uniswap/src/features/transactions/signing'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { getRouteAnalyticsData } from 'uniswap/src/features/transactions/swap/analytics'
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

import { waitForTransactionConfirmation } from 'wallet/src/features/transactions/swap/confirmation'
import { isSignedPermit, SignedPermit } from 'wallet/src/features/transactions/swap/types/preSignedTransaction'
import { getSignerManager } from 'wallet/src/features/wallet/context'

// If the app is closed during the waiting period and then reopened, the saga will resume;
// the order should not be submitted if too much time has passed as it may be stale.
export const ORDER_STALENESS_THRESHOLD = 45 * ONE_SECOND_MS

export interface SubmitUniswapXOrderParams {
  // internal id used for tracking transactions before they're submitted
  txId?: string
  quote: TradingApi.DutchQuoteV2 | TradingApi.DutchQuoteV3 | TradingApi.PriorityQuote
  routing: TradingApi.Routing.DUTCH_V2 | TradingApi.Routing.DUTCH_V3 | TradingApi.Routing.PRIORITY
  permit: ValidatedPermit | SignedPermit
  chainId: UniverseChainId
  account: AccountMeta
  typeInfo: TransactionTypeInfo
  analytics: SwapTradeBaseProperties
  approveTxHash?: string
  onSuccess: () => void
  onFailure: () => void
}

export function* submitUniswapXOrder(params: SubmitUniswapXOrderParams) {
  const { quote, routing, permit, approveTxHash, txId, chainId, typeInfo, account, analytics, onSuccess, onFailure } =
    params

  const orderHash = quote.orderId

  const order = {
    routing,
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

  if (approveTxHash) {
    const waitStartTime = Date.now()

    const { success } = yield* waitForTransactionConfirmation({ hash: approveTxHash })
    let failureCondition: QueuedOrderStatus | undefined

    if (!success) {
      failureCondition = QueuedOrderStatus.ApprovalFailed
    } else if (Date.now() - waitStartTime > ORDER_STALENESS_THRESHOLD) {
      failureCondition = QueuedOrderStatus.Stale
    }

    if (failureCondition) {
      yield* put(transactionActions.updateTransaction({ ...order, queueStatus: failureCondition }))
      yield* call(onFailure)
      return
    }
  }

  // Submit transaction
  try {
    const addedTime = Date.now() // refresh the addedTime to match the actual submission time
    yield* put(transactionActions.updateTransaction({ ...order, queueStatus: QueuedOrderStatus.Submitted, addedTime }))

    let signature: string
    if (isSignedPermit(permit)) {
      signature = permit.signedData
    } else {
      const signerManager = yield* call(getSignerManager)
      const signer = yield* call([signerManager, 'getSignerForAccount'], account)
      signature = yield* call(signTypedData, {
        domain: permit.domain,
        types: permit.types,
        value: permit.values,
        signer,
      })
    }
    yield* call(TradingApiClient.submitOrder, { signature, quote, routing })
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
