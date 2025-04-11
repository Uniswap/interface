import { MaxUint256 } from '@ethersproject/constants'
import { call, select } from '@redux-saga/core/effects'
import { permit2Address } from '@uniswap/permit2-sdk'
import { Protocol } from '@uniswap/router-sdk'
import { TradeType } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import JSBI from 'jsbi'
import { expectSaga, testSaga } from 'redux-saga-test-plan'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { ClassicTrade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  ExactInputSwapTransactionInfo,
  TransactionOriginType,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { WETH } from 'uniswap/src/test/fixtures'
import { mockPermit } from 'uniswap/src/test/fixtures/permit'
import { currencyId } from 'uniswap/src/utils/currencyId'
import {
  SendTransactionParams,
  sendTransaction,
  tryGetNonce,
} from 'wallet/src/features/transactions/sendTransactionSaga'
import { SubmitUniswapXOrderParams, submitUniswapXOrder } from 'wallet/src/features/transactions/swap/submitOrderSaga'
import { SwapParams, approveAndSwap, shouldSubmitViaPrivateRpc } from 'wallet/src/features/transactions/swap/swapSaga'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectWalletSwapProtectionSetting } from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { getTxProvidersMocks } from 'wallet/src/test/mocks'

jest.mock('uniswap/src/features/gating/sdk/statsig', () => ({
  Statsig: {
    checkGate: jest.fn().mockReturnValue(true),
  },
}))

const account = signerMnemonicAccount()

const MOCK_TIMESTAMP = 1487076708000
const CHAIN_ID = UniverseChainId.Mainnet
const universalRouterAddress = UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, CHAIN_ID)

const { mockProvider } = getTxProvidersMocks()

const mockTransactionTypeInfo: ExactInputSwapTransactionInfo = {
  type: TransactionType.Swap,
  tradeType: TradeType.EXACT_INPUT,
  inputCurrencyId: currencyId(NativeCurrency.onChain(CHAIN_ID)),
  outputCurrencyId: '0xabc',
  inputCurrencyAmountRaw: '10000',
  expectedOutputCurrencyAmountRaw: '200000',
  minimumOutputCurrencyAmountRaw: '300000',
  protocol: Protocol.V3,
}

jest.mock('uniswap/src/features/transactions/swap/utils/trade', () => {
  return {
    tradeToTransactionInfo: (): TransactionTypeInfo => mockTransactionTypeInfo,
  }
})

// TODO(WEB-4499): Use Trade/Quote fixtures instead of casted objects
const mockTrade = {
  routing: Routing.CLASSIC,
  inputAmount: { currency: new NativeCurrency(CHAIN_ID) },
  outputAmount: { currency: USDC },
  quote: { amount: MaxUint256 },
  slippageTolerance: 0.5,
} as unknown as ClassicTrade

const mockUniswapXTrade = {
  routing: Routing.DUTCH_V2,
  inputAmount: { currency: new NativeCurrency(CHAIN_ID), quotient: JSBI.BigInt(1000) },
  outputAmount: { currency: USDC },
  quote: { amount: MaxUint256, routing: Routing.DUTCH_V2 },
  slippageTolerance: 0.5,
} as unknown as UniswapXTrade

const mockRevocationTxRequest = {
  chainId: 1,
  to: DAI.address,
  data: '0x0',
}

const mockApproveTxRequest = {
  chainId: 1,
  to: DAI.address,
  data: '0x0',
  nonce: 1,
}

const mockWrapTxRequest = {
  chainId: 1,
  to: WETH.address,
  data: '0x0',
}

const mockSwapTxRequest = {
  chainId: 1,
  to: universalRouterAddress,
  data: '0x0',
}

const classicSwapParams = {
  txId: '1',
  account,
  analytics: {
    transactionOriginType: TransactionOriginType.Internal,
  } as ReturnType<typeof getBaseTradeAnalyticsProperties>,
  swapTxContext: {
    routing: Routing.CLASSIC,
    approveTxRequest: mockApproveTxRequest,
    revocationTxRequest: mockRevocationTxRequest,
    txRequest: mockSwapTxRequest,
    trade: mockTrade,
    indicativeTrade: undefined,
    gasFee: { value: '5', isLoading: false, error: null },
    gasFeeEstimation: {},
    permit: undefined,
    swapRequestArgs: undefined,
    unsigned: false,
  },
  onSuccess: jest.fn(),
  onFailure: jest.fn(),
} satisfies SwapParams

const uniswapXSwapParams = {
  txId: '1',
  account,
  analytics: {
    transactionOriginType: TransactionOriginType.Internal,
  } as ReturnType<typeof getBaseTradeAnalyticsProperties>,
  swapTxContext: {
    routing: Routing.DUTCH_V2,
    approveTxRequest: mockApproveTxRequest,
    revocationTxRequest: mockRevocationTxRequest,
    trade: mockUniswapXTrade,
    indicativeTrade: undefined,
    permit: mockPermit,
    wrapTxRequest: undefined,
    gasFee: { value: '5', isLoading: false, error: null },
    gasFeeEstimation: {},
    gasFeeBreakdown: { classicGasUseEstimateUSD: '5', approvalCost: '5', wrapCost: '0' },
  },
  onSuccess: jest.fn(),
  onFailure: jest.fn(),
} satisfies SwapParams

const nonce = 1

const expectedSendApprovalParams: SendTransactionParams = {
  chainId: mockApproveTxRequest.chainId,
  account,
  options: {
    request: mockApproveTxRequest,
    submitViaPrivateRpc: false,
    userSubmissionTimestampMs: MOCK_TIMESTAMP,
  },
  typeInfo: {
    type: TransactionType.Approve,
    tokenAddress: mockApproveTxRequest.to,
    spender: permit2Address(mockApproveTxRequest.chainId),
    swapTxId: '1',
    gasEstimates: undefined,
  },
  transactionOriginType: TransactionOriginType.Internal,
  analytics: {
    transactionOriginType: TransactionOriginType.Internal,
  },
}

describe(approveAndSwap, () => {
  let dateNowSpy: jest.SpyInstance
  const sharedProviders: (EffectProviders | StaticProvider)[] = [
    [select(selectWalletSwapProtectionSetting), SwapProtectionSetting.Off],
    [call(getProvider, mockSwapTxRequest.chainId), mockProvider],
    [call(tryGetNonce, classicSwapParams.account, mockSwapTxRequest.chainId), { nonce }],
  ]

  beforeAll(() => {
    // Lock Time
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => MOCK_TIMESTAMP)
  })

  afterAll(() => {
    // Unlock Time
    dateNowSpy?.mockRestore()
  })

  it('sends a swap tx', async () => {
    const classicSwapParamsWithoutApprove = {
      ...classicSwapParams,
      swapTxContext: {
        ...classicSwapParams.swapTxContext,
        approveTxRequest: undefined,
        revocationTxRequest: undefined,
      },
    } satisfies SwapParams

    const expectedSendSwapParams: SendTransactionParams = {
      chainId: classicSwapParamsWithoutApprove.swapTxContext.txRequest.chainId,
      account: classicSwapParamsWithoutApprove.account,
      options: {
        request: { ...mockSwapTxRequest, nonce },
        submitViaPrivateRpc: false,
        userSubmissionTimestampMs: Date.now(),
      },
      typeInfo: mockTransactionTypeInfo,
      analytics: classicSwapParamsWithoutApprove.analytics,
      txId: classicSwapParamsWithoutApprove.txId,
      transactionOriginType: TransactionOriginType.Internal,
    }

    // `expectSaga` tests the entire saga at once w/out manually specifying all effect return values.
    // It does not ensure proper ordering; this is tested by testSaga below.
    await expectSaga(approveAndSwap, classicSwapParamsWithoutApprove)
      .provide([
        ...sharedProviders,
        [
          call(sendTransaction, expectedSendSwapParams),
          { transactionResponse: { hash: '0xMockSwapTxHash' }, populatedRequest: {} },
        ],
      ])
      .call(sendTransaction, expectedSendSwapParams)
      .silentRun()

    // `testSaga` ensures that the saga yields specific types of effects in a particular order.
    // Requires manually providing return values for each effect in `.next()`.
    testSaga(approveAndSwap, classicSwapParamsWithoutApprove)
      .next()
      .call(classicSwapParams.onSuccess)
      .next()
      .call(shouldSubmitViaPrivateRpc, classicSwapParams.swapTxContext.txRequest.chainId)
      .next(false)
      .call(tryGetNonce, classicSwapParams.account, mockSwapTxRequest.chainId)
      .next({ nonce })
      .call(sendTransaction, expectedSendSwapParams)
      .next({ transactionResponse: { hash: '0xMockSwapTxHash' }, populatedRequest: {} })
      .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
      .next()
      .isDone()
  })

  it('sends a swap tx with incremented nonce if an approve tx is sent first', async () => {
    const expectedSendSwapParams: SendTransactionParams = {
      chainId: classicSwapParams.swapTxContext.txRequest.chainId,
      account: classicSwapParams.account,
      options: {
        request: { ...mockSwapTxRequest, nonce: nonce + 1 },
        submitViaPrivateRpc: false,
        userSubmissionTimestampMs: Date.now(),
      },
      typeInfo: mockTransactionTypeInfo,
      analytics: classicSwapParams.analytics,
      txId: classicSwapParams.txId,
      transactionOriginType: TransactionOriginType.Internal,
    }
    await expectSaga(approveAndSwap, classicSwapParams)
      .provide([
        ...sharedProviders,
        [
          call(sendTransaction, expectedSendApprovalParams),
          { transactionResponse: { hash: '0xMockApprovalTxHash' }, populatedRequest: {} },
        ],
        [
          call(sendTransaction, expectedSendSwapParams),
          { transactionResponse: { hash: '0xMockSwapTxHash' }, populatedRequest: {} },
        ],
      ])
      .call(sendTransaction, expectedSendSwapParams)
      .silentRun()
    testSaga(approveAndSwap, classicSwapParams)
      .next()
      .call(classicSwapParams.onSuccess)
      .next()
      .call(shouldSubmitViaPrivateRpc, classicSwapParams.swapTxContext.txRequest.chainId)
      .next(false)
      .call(tryGetNonce, classicSwapParams.account, mockSwapTxRequest.chainId)
      .next({ nonce })
      .call(sendTransaction, expectedSendApprovalParams)
      .next({ transactionResponse: { hash: '0xMockApprovalTxHash' }, populatedRequest: {} })
      .call(sendTransaction, expectedSendSwapParams)
      .next({ transactionResponse: { hash: '0xMockSwapTxHash' }, populatedRequest: {} })
      .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
      .next()
      .isDone()
  })

  it('sends a uniswapx order', async () => {
    const expectedSubmitOrderParams: SubmitUniswapXOrderParams = {
      chainId: uniswapXSwapParams.swapTxContext.trade.inputAmount.currency.chainId,
      account: uniswapXSwapParams.account,
      typeInfo: mockTransactionTypeInfo,
      analytics: uniswapXSwapParams.analytics,
      approveTxHash: '0xMockApprovalTxHash',
      wrapTxHash: undefined,
      txId: uniswapXSwapParams.txId,
      permit: mockPermit,
      routing: uniswapXSwapParams.swapTxContext.trade.quote.routing,
      quote: uniswapXSwapParams.swapTxContext.trade.quote.quote,
      onSuccess: uniswapXSwapParams.onSuccess,
      onFailure: uniswapXSwapParams.onFailure,
    }

    await expectSaga(approveAndSwap, uniswapXSwapParams)
      .provide([
        ...sharedProviders,
        [
          call(sendTransaction, expectedSendApprovalParams),
          { transactionResponse: { hash: '0xMockApprovalTxHash' }, populatedRequest: {} },
        ],
        [call(submitUniswapXOrder, expectedSubmitOrderParams), undefined],
      ])
      .call.fn(submitUniswapXOrder)
      .silentRun()

    testSaga(approveAndSwap, uniswapXSwapParams)
      .next()
      .call(tryGetNonce, classicSwapParams.account, mockSwapTxRequest.chainId)
      .next({ nonce })
      .call(sendTransaction, expectedSendApprovalParams)
      .next({ transactionResponse: { hash: '0xMockApprovalTxHash' }, populatedRequest: {} })
      .call(submitUniswapXOrder, expectedSubmitOrderParams)
      .next()
      .isDone()
  })

  it('sends an ETH-input uniswapx order', async () => {
    const uniswapXSwapEthInputParams = {
      ...uniswapXSwapParams,
      swapTxContext: {
        ...uniswapXSwapParams.swapTxContext,
        wrapTxRequest: mockWrapTxRequest,
        permit: mockPermit,
        gasFeeEstimation: {},
      },
    } satisfies SwapParams

    const expectedSendWrapParams: SendTransactionParams = {
      chainId: mockWrapTxRequest.chainId,
      account,
      options: { request: { ...mockWrapTxRequest, nonce: nonce + 1 } },
      typeInfo: {
        type: TransactionType.Wrap,
        unwrapped: false,
        currencyAmountRaw: '1000',
        swapTxId: '1',
        gasEstimates: undefined,
      },
      txId: undefined,
      transactionOriginType: TransactionOriginType.Internal,
    }

    const expectedSubmitOrderParams: SubmitUniswapXOrderParams = {
      chainId: uniswapXSwapParams.swapTxContext.trade.inputAmount.currency.chainId,
      account: uniswapXSwapParams.account,
      typeInfo: mockTransactionTypeInfo,
      analytics: uniswapXSwapParams.analytics,
      approveTxHash: '0xMockApprovalTxHash',
      wrapTxHash: '0xMockWrapTxHash',
      txId: uniswapXSwapParams.txId,
      permit: mockPermit,
      onSuccess: uniswapXSwapParams.onSuccess,
      onFailure: uniswapXSwapParams.onFailure,
      routing: uniswapXSwapParams.swapTxContext.trade.quote.routing,
      quote: uniswapXSwapParams.swapTxContext.trade.quote.quote,
    }

    await expectSaga(approveAndSwap, uniswapXSwapEthInputParams)
      .provide([
        ...sharedProviders,
        [
          call(sendTransaction, expectedSendApprovalParams),
          { transactionResponse: { hash: '0xMockApprovalTxHash' }, populatedRequest: {} },
        ],
        [
          call(sendTransaction, expectedSendWrapParams),
          { transactionResponse: { hash: '0xMockWrapTxHash' }, populatedRequest: {} },
        ],
        [call(submitUniswapXOrder, expectedSubmitOrderParams), undefined],
      ])
      .call.fn(submitUniswapXOrder)
      .silentRun()

    testSaga(approveAndSwap, uniswapXSwapEthInputParams)
      .next()
      .call(tryGetNonce, classicSwapParams.account, mockSwapTxRequest.chainId)
      .next({ nonce })
      .call(sendTransaction, expectedSendApprovalParams)
      .next({ transactionResponse: { hash: '0xMockApprovalTxHash' }, populatedRequest: {} })
      .call(sendTransaction, expectedSendWrapParams)
      .next({ transactionResponse: { hash: '0xMockWrapTxHash' }, populatedRequest: {} })
      .call(submitUniswapXOrder, expectedSubmitOrderParams)
      .next()
      .isDone()
  })
})
