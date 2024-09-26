import { Protocol } from '@uniswap/router-sdk'
import { TradeType } from '@uniswap/sdk-core'
import { testSaga } from 'redux-saga-test-plan'
import { submitOrder } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { OrderRequest, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { addTransaction, finalizeTransaction, updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  QueuedOrderStatus,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  ORDER_STALENESS_THRESHOLD,
  SubmitUniswapXOrderParams,
  submitUniswapXOrder,
} from 'wallet/src/features/transactions/swap/submitOrderSaga'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

const baseSubmitOrderParams = {
  chainId: UniverseChainId.Mainnet,
  account: signerMnemonicAccount(),
  typeInfo: {
    type: TransactionType.Swap,
    tradeType: TradeType.EXACT_INPUT,
    inputCurrencyId: currencyId(NativeCurrency.onChain(UniverseChainId.Mainnet)),
    outputCurrencyId: '0xabc',
    inputCurrencyAmountRaw: '10000',
    expectedOutputCurrencyAmountRaw: '200000',
    minimumOutputCurrencyAmountRaw: '300000',
    protocol: Protocol.V3,
  },
  analytics: {
    transactionOriginType: TransactionOriginType.Internal,
  },
  txId: '1',
  orderParams: { quote: { orderId: '0xMockOrderHash' } } as unknown as OrderRequest,
  onSubmit: jest.fn(),
  onFailure: jest.fn(),
} satisfies SubmitUniswapXOrderParams

const baseExpectedInitialOrderDetails: UniswapXOrderDetails = {
  routing: Routing.DUTCH_V2,
  orderHash: baseSubmitOrderParams.orderParams.quote.orderId,
  id: baseSubmitOrderParams.txId,
  chainId: baseSubmitOrderParams.chainId,
  typeInfo: baseSubmitOrderParams.typeInfo,
  from: baseSubmitOrderParams.account.address,
  addedTime: 1,
  status: TransactionStatus.Pending,
  queueStatus: QueuedOrderStatus.Waiting,
  transactionOriginType: TransactionOriginType.Internal,
}

describe(submitUniswapXOrder, () => {
  beforeEach(() => {
    let mockTimestamp = 1
    Date.now = jest.fn(() => mockTimestamp++)
  })

  it('sends a uniswapx order', async () => {
    const expectedSubmittedOrderDetails = {
      ...baseExpectedInitialOrderDetails,
      addedTime: 3,
      queueStatus: QueuedOrderStatus.Submitted,
    } satisfies UniswapXOrderDetails

    testSaga(submitUniswapXOrder, baseSubmitOrderParams)
      .next()
      .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
      .next()
      .put({ type: updateTransaction.type, payload: expectedSubmittedOrderDetails })
      .next()
      .call(submitOrder, baseSubmitOrderParams.orderParams)
      .next()
      .call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, {
        routing: Routing.DUTCH_V2,
        order_hash: baseExpectedInitialOrderDetails.orderHash,
        transactionOriginType: TransactionOriginType.Internal,
      })
      .next()
      .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
      .next()
      .call(baseSubmitOrderParams.onSubmit)
      .next()
      .isDone()
  })

  it('updates an order properly if order submission fails', async () => {
    const expectedSubmittedOrderDetails = {
      ...baseExpectedInitialOrderDetails,
      addedTime: 3,
      queueStatus: QueuedOrderStatus.Submitted,
    }

    testSaga(submitUniswapXOrder, baseSubmitOrderParams)
      .next()
      .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
      .next()
      .put({ type: updateTransaction.type, payload: expectedSubmittedOrderDetails })
      .next()
      .call(submitOrder, baseSubmitOrderParams.orderParams)
      .throw(new Error('pretend the order endpoint failed'))
      .put({
        type: updateTransaction.type,
        payload: {
          ...baseExpectedInitialOrderDetails,
          queueStatus: QueuedOrderStatus.SubmissionFailed,
        },
      })
      .next()
      .call(baseSubmitOrderParams.onFailure)
      .next()
      .isDone()
  })

  describe('blocking tx edge cases', () => {
    const approveTxHash = '0xMockApprovalTxHash'
    const wrapTxHash = '0xMockWrapTxHash'

    it('waits for approval and then sends a uniswapx order', async () => {
      const expectedSubmittedOrderDetails = {
        ...baseExpectedInitialOrderDetails,
        addedTime: 5,
        queueStatus: QueuedOrderStatus.Submitted,
      } satisfies UniswapXOrderDetails

      testSaga(submitUniswapXOrder, { ...baseSubmitOrderParams, approveTxHash })
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .take(finalizeTransaction.type)
        .next({ payload: { hash: "different transaction not the one we're waiting for" } })
        .take(finalizeTransaction.type)
        .next({ payload: { hash: approveTxHash, status: TransactionStatus.Success } })
        .put({ type: updateTransaction.type, payload: expectedSubmittedOrderDetails })
        .next()
        .call(submitOrder, baseSubmitOrderParams.orderParams)
        .next()
        .call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, {
          routing: Routing.DUTCH_V2,
          order_hash: baseExpectedInitialOrderDetails.orderHash,
          transactionOriginType: TransactionOriginType.Internal,
        })
        .next()
        .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
        .next()
        .call(baseSubmitOrderParams.onSubmit)
        .next()
        .isDone()
    })

    it('waits for wrap and then sends a uniswapx order', async () => {
      const expectedSubmittedOrderDetails = {
        ...baseExpectedInitialOrderDetails,
        addedTime: 5,
        queueStatus: QueuedOrderStatus.Submitted,
      } satisfies UniswapXOrderDetails

      testSaga(submitUniswapXOrder, { ...baseSubmitOrderParams, wrapTxHash })
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .take(finalizeTransaction.type)
        .next({ payload: { hash: "different transaction not the one we're waiting for" } })
        .take(finalizeTransaction.type)
        .next({ payload: { hash: wrapTxHash, status: TransactionStatus.Success } })
        .put({ type: updateTransaction.type, payload: expectedSubmittedOrderDetails })
        .next()
        .call(submitOrder, baseSubmitOrderParams.orderParams)
        .next()
        .call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, {
          routing: Routing.DUTCH_V2,
          order_hash: baseExpectedInitialOrderDetails.orderHash,
          transactionOriginType: TransactionOriginType.Internal,
        })
        .next()
        .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
        .next()
        .call(baseSubmitOrderParams.onSubmit)
        .next()
        .isDone()
    })

    it('waits for approval and wrap and sends a uniswapx order', async () => {
      const expectedSubmittedOrderDetails = {
        ...baseExpectedInitialOrderDetails,
        addedTime: 5,
        queueStatus: QueuedOrderStatus.Submitted,
      } satisfies UniswapXOrderDetails

      testSaga(submitUniswapXOrder, { ...baseSubmitOrderParams, wrapTxHash, approveTxHash })
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .take(finalizeTransaction.type)
        .next({ payload: { hash: wrapTxHash, status: TransactionStatus.Success } })
        .take(finalizeTransaction.type)
        .next({ payload: { hash: approveTxHash, status: TransactionStatus.Success } })
        .put({ type: updateTransaction.type, payload: expectedSubmittedOrderDetails })
        .next()
        .call(submitOrder, baseSubmitOrderParams.orderParams)
        .next()
        .call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, {
          routing: Routing.DUTCH_V2,
          order_hash: baseExpectedInitialOrderDetails.orderHash,
          transactionOriginType: TransactionOriginType.Internal,
        })
        .next()
        .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
        .next()
        .call(baseSubmitOrderParams.onSubmit)
        .next()
        .isDone()
    })

    it('updates state if an approval fails', async () => {
      testSaga(submitUniswapXOrder, { ...baseSubmitOrderParams, approveTxHash })
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .take(finalizeTransaction.type)
        .next({ payload: { hash: approveTxHash, status: TransactionStatus.Failed } })
        .put({
          type: updateTransaction.type,
          payload: {
            ...baseExpectedInitialOrderDetails,
            queueStatus: QueuedOrderStatus.ApprovalFailed,
          },
        })
        .next()
        .call(baseSubmitOrderParams.onFailure)
        .next()
        .isDone()
    })

    it('updates state if an wrap fails', async () => {
      testSaga(submitUniswapXOrder, { ...baseSubmitOrderParams, wrapTxHash })
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .take(finalizeTransaction.type)
        .next({ payload: { hash: wrapTxHash, status: TransactionStatus.Failed } })
        .put({
          type: updateTransaction.type,
          payload: {
            ...baseExpectedInitialOrderDetails,
            queueStatus: QueuedOrderStatus.WrapFailed,
          },
        })
        .next()
        .call(baseSubmitOrderParams.onFailure)
        .next()
        .isDone()
    })

    it('updates state if order becomes stale after waiting too long', async () => {
      let nextTimestampReturnValue = 1
      // Mock more than ORDER_STALENESS_THRESHOLD seconds passing between saga start & wrap finish
      Date.now = jest.fn(() => {
        const timestamp = nextTimestampReturnValue
        nextTimestampReturnValue += ORDER_STALENESS_THRESHOLD + 1
        return timestamp
      })

      testSaga(submitUniswapXOrder, { ...baseSubmitOrderParams, wrapTxHash })
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .take(finalizeTransaction.type)
        .next({ payload: { hash: wrapTxHash, status: TransactionStatus.Success } })
        .put({
          type: updateTransaction.type,
          payload: {
            ...baseExpectedInitialOrderDetails,
            queueStatus: QueuedOrderStatus.Stale,
          },
        })
        .next()
        .call(baseSubmitOrderParams.onFailure)
        .next()
        .isDone()
    })
  })
})
