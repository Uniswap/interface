import { Protocol } from '@uniswap/router-sdk'
import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { testSaga } from 'redux-saga-test-plan'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { signTypedData } from 'uniswap/src/features/transactions/signing'
import { addTransaction, finalizeTransaction, updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  QueuedOrderStatus,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { mockPermit } from 'uniswap/src/test/fixtures/permit'
import { currencyId } from 'uniswap/src/utils/currencyId'
import {
  ORDER_STALENESS_THRESHOLD,
  SubmitUniswapXOrderParams,
  submitUniswapXOrder,
} from 'wallet/src/features/transactions/swap/submitOrderSaga'
import { getSignerManager } from 'wallet/src/features/wallet/context'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

const mockSignature = '0xMockSignature'
const mockSigner = {}
const mockSignerManager = {
  getSignerForAccount: jest.fn(),
}

const baseSubmitOrderParams = {
  chainId: UniverseChainId.Mainnet,
  account: signerMnemonicAccount(),
  typeInfo: {
    type: TransactionType.Swap,
    tradeType: TradeType.EXACT_INPUT,
    inputCurrencyId: currencyId(nativeOnChain(UniverseChainId.Mainnet)),
    outputCurrencyId: '0xabc',
    inputCurrencyAmountRaw: '10000',
    expectedOutputCurrencyAmountRaw: '200000',
    minimumOutputCurrencyAmountRaw: '300000',
    protocol: Protocol.V3,
  },
  analytics: {
    routing: 'uniswap_x_v2',
    transactionOriginType: TransactionOriginType.Internal,
  },
  txId: '1',
  onSuccess: jest.fn(),
  onFailure: jest.fn(),
  routing: TradingApi.Routing.DUTCH_V2,
  quote: {
    orderId: '0xMockOrderHash',
    encodedOrder: '0xMockEncodedOrder',
    orderInfo: {} as TradingApi.DutchOrderInfo,
  } as unknown as TradingApi.DutchQuoteV2,
  permit: mockPermit.typedData,
} satisfies SubmitUniswapXOrderParams

const baseExpectedInitialOrderDetails: UniswapXOrderDetails = {
  routing: TradingApi.Routing.DUTCH_V2,
  orderHash: '0xMockOrderHash',
  id: baseSubmitOrderParams.txId,
  chainId: baseSubmitOrderParams.chainId,
  typeInfo: baseSubmitOrderParams.typeInfo,
  from: baseSubmitOrderParams.account.address,
  addedTime: 1,
  status: TransactionStatus.Pending,
  queueStatus: QueuedOrderStatus.Waiting,
  transactionOriginType: TransactionOriginType.Internal,
}

const expectedOrderRequest: TradingApi.OrderRequest = {
  signature: mockSignature,
  quote: baseSubmitOrderParams.quote,
  routing: TradingApi.Routing.DUTCH_V2,
}

describe(submitUniswapXOrder, () => {
  beforeEach(() => {
    let mockTimestamp = 1
    Date.now = jest.fn(() => mockTimestamp++)
  })

  describe('with ValidatedPermit', () => {
    it('sends a uniswapx order', async () => {
      const expectedSubmittedOrderDetails = {
        ...baseExpectedInitialOrderDetails,
        addedTime: 2,
        queueStatus: QueuedOrderStatus.Submitted,
      } satisfies UniswapXOrderDetails

      testSaga(submitUniswapXOrder, baseSubmitOrderParams)
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .put({ type: updateTransaction.type, payload: expectedSubmittedOrderDetails })
        .next()
        .call(getSignerManager)
        .next(mockSignerManager)
        .call([mockSignerManager, 'getSignerForAccount'], baseSubmitOrderParams.account)
        .next(mockSigner)
        .call(signTypedData, {
          domain: mockPermit.typedData.domain,
          types: mockPermit.typedData.types,
          value: mockPermit.typedData.values,
          signer: mockSigner,
        })
        .next(mockSignature)
        .call(TradingApiClient.submitOrder, expectedOrderRequest)
        .next()
        .call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, {
          routing: 'uniswap_x_v2',
          order_hash: baseExpectedInitialOrderDetails.orderHash,
          transactionOriginType: TransactionOriginType.Internal,
          v2Used: false,
          v3Used: false,
          v4Used: false,
          uniswapXUsed: true,
          jupiterUsed: false,
        })
        .next()
        .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
        .next()
        .call(baseSubmitOrderParams.onSuccess)
        .next()
        .isDone()
    })

    it('updates an order properly if order submission fails', async () => {
      const expectedSubmittedOrderDetails = {
        ...baseExpectedInitialOrderDetails,
        addedTime: 2,
        queueStatus: QueuedOrderStatus.Submitted,
      }

      testSaga(submitUniswapXOrder, baseSubmitOrderParams)
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .put({ type: updateTransaction.type, payload: expectedSubmittedOrderDetails })
        .next()
        .call(getSignerManager)
        .next(mockSignerManager)
        .call([mockSignerManager, 'getSignerForAccount'], baseSubmitOrderParams.account)
        .next(mockSigner)
        .call(signTypedData, {
          domain: mockPermit.typedData.domain,
          types: mockPermit.typedData.types,
          value: mockPermit.typedData.values,
          signer: mockSigner,
        })
        .next(mockSignature)
        .call(TradingApiClient.submitOrder, expectedOrderRequest)
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
  })

  describe('with SignedPermit', () => {
    const mockSignedPermit = {
      permit: mockPermit.typedData,
      signedData: mockSignature,
    }

    const signedPermitParams = {
      ...baseSubmitOrderParams,
      permit: mockSignedPermit,
    }

    it('sends a uniswapx order without calling signer', async () => {
      const expectedSubmittedOrderDetails = {
        ...baseExpectedInitialOrderDetails,
        addedTime: 2,
        queueStatus: QueuedOrderStatus.Submitted,
      } satisfies UniswapXOrderDetails

      testSaga(submitUniswapXOrder, signedPermitParams)
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .put({ type: updateTransaction.type, payload: expectedSubmittedOrderDetails })
        .next()
        // Should skip getSignerManager and getSignerForAccount calls
        // Should skip signTypedData call and use the pre-signed data directly
        .call(TradingApiClient.submitOrder, expectedOrderRequest)
        .next()
        .call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, {
          routing: 'uniswap_x_v2',
          order_hash: baseExpectedInitialOrderDetails.orderHash,
          transactionOriginType: TransactionOriginType.Internal,
          v2Used: false,
          v3Used: false,
          v4Used: false,
          uniswapXUsed: true,
          jupiterUsed: false,
        })
        .next()
        .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
        .next()
        .call(signedPermitParams.onSuccess)
        .next()
        .isDone()
    })

    it('updates an order properly if order submission fails', async () => {
      const expectedSubmittedOrderDetails = {
        ...baseExpectedInitialOrderDetails,
        addedTime: 2,
        queueStatus: QueuedOrderStatus.Submitted,
      }

      testSaga(submitUniswapXOrder, signedPermitParams)
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .put({ type: updateTransaction.type, payload: expectedSubmittedOrderDetails })
        .next()
        .call(TradingApiClient.submitOrder, expectedOrderRequest)
        .throw(new Error('pretend the order endpoint failed'))
        .put({
          type: updateTransaction.type,
          payload: {
            ...baseExpectedInitialOrderDetails,
            queueStatus: QueuedOrderStatus.SubmissionFailed,
          },
        })
        .next()
        .call(signedPermitParams.onFailure)
        .next()
        .isDone()
    })
  })

  describe('blocking tx edge cases', () => {
    const approveTxHash = '0xMockApprovalTxHash'

    it('waits for approval and then sends a uniswapx order', async () => {
      const expectedSubmittedOrderDetails = {
        ...baseExpectedInitialOrderDetails,
        addedTime: 4,
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
        .call(getSignerManager)
        .next(mockSignerManager)
        .call([mockSignerManager, 'getSignerForAccount'], baseSubmitOrderParams.account)
        .next(mockSigner)
        .call(signTypedData, {
          domain: mockPermit.typedData.domain,
          types: mockPermit.typedData.types,
          value: mockPermit.typedData.values,
          signer: mockSigner,
        })
        .next(mockSignature)
        .call(TradingApiClient.submitOrder, expectedOrderRequest)
        .next()
        .call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, {
          routing: 'uniswap_x_v2',
          order_hash: baseExpectedInitialOrderDetails.orderHash,
          transactionOriginType: TransactionOriginType.Internal,
          v2Used: false,
          v3Used: false,
          v4Used: false,
          uniswapXUsed: true,
          jupiterUsed: false,
        })
        .next()
        .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
        .next()
        .call(baseSubmitOrderParams.onSuccess)
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

    it('updates state if order becomes stale after waiting too long', async () => {
      let nextTimestampReturnValue = 1
      // Mock more than ORDER_STALENESS_THRESHOLD seconds passing between saga start & wrap finish
      Date.now = jest.fn(() => {
        const timestamp = nextTimestampReturnValue
        nextTimestampReturnValue += ORDER_STALENESS_THRESHOLD + 1
        return timestamp
      })

      testSaga(submitUniswapXOrder, { ...baseSubmitOrderParams, approveTxHash })
        .next()
        .put({ type: addTransaction.type, payload: baseExpectedInitialOrderDetails })
        .next()
        .take(finalizeTransaction.type)
        .next({ payload: { hash: approveTxHash, status: TransactionStatus.Success } })
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
