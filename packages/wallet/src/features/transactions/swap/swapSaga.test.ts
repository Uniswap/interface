import { MaxUint256 } from '@ethersproject/constants'
import { call, select } from '@redux-saga/core/effects'
import { permit2Address } from '@uniswap/permit2-sdk'
import { Protocol } from '@uniswap/router-sdk'
import { TradeType } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import { TradingApi } from '@universe/api'
import JSBI from 'jsbi'
import { expectSaga, testSaga } from 'redux-saga-test-plan'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { DAI, nativeOnChain, USDC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { ClassicTrade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  ExactInputSwapTransactionInfo,
  TransactionOriginType,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { mockPermit } from 'uniswap/src/test/fixtures/permit'
import { currencyId } from 'uniswap/src/utils/currencyId'
import {
  ExecuteTransactionParams,
  executeTransaction,
} from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { tryGetNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import { getShouldWaitBetweenTransactions } from 'wallet/src/features/transactions/swap/confirmation'
import { SubmitUniswapXOrderParams, submitUniswapXOrder } from 'wallet/src/features/transactions/swap/submitOrderSaga'
import {
  approveAndSwap,
  handleTransactionSpacing,
  SwapParams,
  shouldSubmitViaPrivateRpc,
} from 'wallet/src/features/transactions/swap/swapSaga'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectWalletSwapProtectionSetting } from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { getTxProvidersMocks } from 'wallet/src/test/mocks'

jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  getStatsigClient: jest.fn(() => ({
    checkGate: jest.fn().mockReturnValue(true),
    getLayer: jest.fn(() => ({
      get: jest.fn(() => false),
    })),
  })),
}))

const account = signerMnemonicAccount()

const MOCK_TIMESTAMP = 1487076708000
const CHAIN_ID = UniverseChainId.Mainnet
const universalRouterAddress = UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, CHAIN_ID)

const { mockProvider } = getTxProvidersMocks()

const mockTransactionTypeInfo: ExactInputSwapTransactionInfo = {
  type: TransactionType.Swap,
  tradeType: TradeType.EXACT_INPUT,
  inputCurrencyId: currencyId(nativeOnChain(CHAIN_ID)),
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
  routing: TradingApi.Routing.CLASSIC,
  inputAmount: { currency: nativeOnChain(CHAIN_ID) },
  outputAmount: { currency: USDC },
  quote: { amount: MaxUint256 },
  slippageTolerance: 0.5,
} as unknown as ClassicTrade

const mockUniswapXTrade = {
  routing: TradingApi.Routing.DUTCH_V2,
  inputAmount: { currency: nativeOnChain(CHAIN_ID), quotient: JSBI.BigInt(1000) },
  outputAmount: { currency: USDC },
  quote: { amount: MaxUint256, routing: TradingApi.Routing.DUTCH_V2 },
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
  } as SwapTradeBaseProperties,
  swapTxContext: {
    routing: TradingApi.Routing.CLASSIC,
    approveTxRequest: mockApproveTxRequest,
    revocationTxRequest: mockRevocationTxRequest,
    txRequests: [mockSwapTxRequest],
    trade: mockTrade,
    gasFee: { value: '5', isLoading: false, error: null },
    gasFeeEstimation: {},
    permit: undefined,
    swapRequestArgs: undefined,
    unsigned: false,
    includesDelegation: false,
  },
  onSuccess: jest.fn(),
  onPending: jest.fn(),
  onFailure: jest.fn(),
} satisfies SwapParams

const uniswapXSwapParams = {
  txId: '1',
  account,
  analytics: {
    transactionOriginType: TransactionOriginType.Internal,
  } as SwapTradeBaseProperties,
  swapTxContext: {
    routing: TradingApi.Routing.DUTCH_V2,

    approveTxRequest: mockApproveTxRequest,
    revocationTxRequest: mockRevocationTxRequest,
    trade: mockUniswapXTrade,
    permit: mockPermit,
    gasFee: { value: '5', isLoading: false, error: null },
    gasFeeEstimation: {},
    gasFeeBreakdown: { classicGasUseEstimateUSD: '5', approvalCost: '5' },
    includesDelegation: false,
  },
  onSuccess: jest.fn(),
  onPending: jest.fn(),
  onFailure: jest.fn(),
} satisfies SwapParams

const nonce = 1

const expectedSendApprovalParams: ExecuteTransactionParams = {
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
    gasEstimate: undefined,
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
    [
      call(getShouldWaitBetweenTransactions, {
        swapper: account.address,
        chainId: mockSwapTxRequest.chainId,
        privateRpcAvailable: false,
      }),
      false,
    ],
    [call(getProvider, mockSwapTxRequest.chainId), mockProvider],
    [call(tryGetNonce, classicSwapParams.account, mockSwapTxRequest.chainId), { nonce }],
  ]

  beforeAll(() => {
    // Lock Time
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => MOCK_TIMESTAMP)
  })

  afterAll(() => {
    // Unlock Time
    dateNowSpy.mockRestore()
  })

  it('sends a swap tx', async () => {
    const classicSwapParamsWithoutApprove = {
      ...classicSwapParams,
      swapTxContext: {
        ...classicSwapParams.swapTxContext,
        approveTxRequest: undefined,
        revocationTxRequest: undefined,
        includesDelegation: false,
      },
    } satisfies SwapParams

    const expectedSendSwapParams: ExecuteTransactionParams = {
      chainId: classicSwapParamsWithoutApprove.swapTxContext.txRequests[0].chainId,
      account: classicSwapParamsWithoutApprove.account,
      options: {
        request: { ...mockSwapTxRequest, nonce },
        submitViaPrivateRpc: false,
        userSubmissionTimestampMs: Date.now(),
        isSmartWalletTransaction: false,
        includesDelegation: false,
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
          call(executeTransaction, expectedSendSwapParams),
          { transactionHash: '0xMockSwapTxHash', populatedRequest: {} },
        ],
      ])
      .call(executeTransaction, expectedSendSwapParams)
      .silentRun()

    // `testSaga` ensures that the saga yields specific types of effects in a particular order.
    // Requires manually providing return values for each effect in `.next()`.
    testSaga(approveAndSwap, classicSwapParamsWithoutApprove)
      .next()
      .call(shouldSubmitViaPrivateRpc, classicSwapParams.swapTxContext.txRequests[0].chainId)
      .next(false)
      .call(getShouldWaitBetweenTransactions, {
        swapper: account.address,
        chainId: expectedSendSwapParams.chainId,
        privateRpcAvailable: false,
      })
      .next(false)
      .call(classicSwapParams.onSuccess)
      .next()
      .call(tryGetNonce, classicSwapParams.account, mockSwapTxRequest.chainId)
      .next({ nonce })
      .call(executeTransaction, expectedSendSwapParams)
      .next({ transactionHash: '0xMockSwapTxHash', populatedRequest: {} })
      .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
      .next()
      .isDone()
  })

  it('sends a swap tx with incremented nonce if an approve tx is sent first', async () => {
    const expectedSendSwapParams: ExecuteTransactionParams = {
      chainId: classicSwapParams.swapTxContext.txRequests[0].chainId,
      account: classicSwapParams.account,
      options: {
        request: { ...mockSwapTxRequest, nonce: nonce + 1 },
        submitViaPrivateRpc: false,
        userSubmissionTimestampMs: Date.now(),
        includesDelegation: false,
        isSmartWalletTransaction: false,
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
          call(executeTransaction, expectedSendApprovalParams),
          { transactionHash: '0xMockApprovalTxHash', populatedRequest: {} },
        ],
        [
          call(executeTransaction, expectedSendSwapParams),
          { transactionHash: '0xMockSwapTxHash', populatedRequest: {} },
        ],
      ])
      .call(executeTransaction, expectedSendSwapParams)
      .silentRun()
    testSaga(approveAndSwap, classicSwapParams)
      .next()
      .call(shouldSubmitViaPrivateRpc, classicSwapParams.swapTxContext.txRequests[0].chainId)
      .next(false)
      .call(getShouldWaitBetweenTransactions, {
        swapper: account.address,
        chainId: expectedSendSwapParams.chainId,
        privateRpcAvailable: false,
      })
      .next(false)
      .call(classicSwapParams.onSuccess)
      .next()
      .call(tryGetNonce, classicSwapParams.account, mockSwapTxRequest.chainId)
      .next({ nonce })
      .call(executeTransaction, expectedSendApprovalParams)
      .next({ transactionHash: '0xMockApprovalTxHash', populatedRequest: {} })
      .call(handleTransactionSpacing, {
        shouldWait: false,
        hash: '0xMockApprovalTxHash',
        onFailure: classicSwapParams.onFailure,
      })
      .next()
      .call(executeTransaction, expectedSendSwapParams)
      .next({ transactionHash: '0xMockSwapTxHash', populatedRequest: {} })
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
      txId: uniswapXSwapParams.txId,
      permit: mockPermit.typedData,
      routing: uniswapXSwapParams.swapTxContext.trade.quote.routing,
      quote: uniswapXSwapParams.swapTxContext.trade.quote.quote,
      onSuccess: uniswapXSwapParams.onSuccess,
      onFailure: uniswapXSwapParams.onFailure,
    }

    await expectSaga(approveAndSwap, uniswapXSwapParams)
      .provide([
        ...sharedProviders,
        [
          call(executeTransaction, expectedSendApprovalParams),
          { transactionHash: '0xMockApprovalTxHash', populatedRequest: {} },
        ],
        [call(submitUniswapXOrder, expectedSubmitOrderParams), undefined],
      ])
      .call.fn(submitUniswapXOrder)
      .silentRun()

    testSaga(approveAndSwap, uniswapXSwapParams)
      .next()
      .call(getShouldWaitBetweenTransactions, {
        swapper: account.address,
        chainId: expectedSubmitOrderParams.chainId,
        privateRpcAvailable: false,
      })
      .next(false)
      .call(uniswapXSwapParams.onPending)
      .next()
      .call(tryGetNonce, classicSwapParams.account, mockSwapTxRequest.chainId)
      .next({ nonce })
      .call(executeTransaction, expectedSendApprovalParams)
      .next({ transactionHash: '0xMockApprovalTxHash', populatedRequest: {} })
      .call(handleTransactionSpacing, {
        shouldWait: false,
        hash: '0xMockApprovalTxHash',
        onFailure: uniswapXSwapParams.onFailure,
      })
      .next()
      .call(submitUniswapXOrder, expectedSubmitOrderParams)
      .next()
      .isDone()
  })
})
