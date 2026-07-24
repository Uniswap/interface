import { call } from '@redux-saga/core/effects'
import { TradingApi } from '@universe/api'
import { expectSaga } from 'redux-saga-test-plan'
import type { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { mockPermit } from 'uniswap/src/test/fixtures/permit'
import type { Mock, MockInstance, MockedFunction } from 'vitest'
import { createTransactionServices } from 'wallet/src/features/transactions/factories/createTransactionServices'
import {
  getShouldWaitBetweenTransactions,
  getSwapTransactionCount,
} from 'wallet/src/features/transactions/swap/confirmation'
import { createExecuteSwapSaga } from 'wallet/src/features/transactions/swap/executeSwapSaga'
import { submitUniswapXOrder } from 'wallet/src/features/transactions/swap/submitOrderSaga'
import {
  mockSignerAccount as account,
  createMockSignedApproveTx,
  mockAnalytics,
  mockBridgeTrade,
  mockClassicTrade,
  mockSwapTxRequest,
  mockTransactionExecutor,
  mockTransactionParamsFactory,
  mockTransactionSagaDependencies,
  mockTransactionService,
  mockTransactionSigner,
  mockWrapTrade,
  prepareExecuteSwapSagaParams,
  preparePreSignedSwapTransaction,
  prepareSwapTxContext,
  prepareUniswapXPreSignedSwapTransaction,
  prepareUniswapXSwapTxContext,
} from 'wallet/src/features/transactions/swap/types/fixtures'
import {
  type TransactionExecutionResult,
  TransactionStepType,
} from 'wallet/src/features/transactions/swap/types/transactionExecutor'
import { DelegationType } from 'wallet/src/features/transactions/types/transactionSagaDependencies'

// Mock dependencies
vi.mock('wallet/src/features/transactions/factories/createTransactionServices')
vi.mock('wallet/src/features/transactions/swap/confirmation')
vi.mock('wallet/src/features/transactions/swap/submitOrderSaga')
vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
  sendAppsFlyerEvent: vi.fn(),
}))

const MOCK_TIMESTAMP = 1487076708000
const CHAIN_ID = UniverseChainId.Mainnet

const mockGetShouldWaitBetweenTransactions = vi.mocked(getShouldWaitBetweenTransactions) as MockedFunction<
  typeof getShouldWaitBetweenTransactions
>
// jest's expect.any returned `any`; vitest's returns AsymmetricMatcher, so cast for typed call() signatures
const anySwapTransactionCountParams = expect.any(Object) as unknown as Parameters<typeof getSwapTransactionCount>[0]
const anySubmitUniswapXOrderParams = expect.any(Object) as unknown as Parameters<typeof submitUniswapXOrder>[0]

const mockGetSwapTransactionCount = vi.mocked(getSwapTransactionCount) as MockedFunction<typeof getSwapTransactionCount>
const mockSubmitUniswapXOrder = vi.mocked(submitUniswapXOrder) as MockedFunction<typeof submitUniswapXOrder>

const mockExecutionResult: TransactionExecutionResult = {
  hash: '0xmockhash',
  success: true,
}

const mockFailedExecutionResult: TransactionExecutionResult = {
  error: new Error('Mock transaction failed'),
  success: false,
}

describe('executeSwapSaga', () => {
  let dateNowSpy: MockInstance
  let executeSwapSaga: ReturnType<typeof createExecuteSwapSaga>
  let mockPrepareAndSignSwapSaga: Mock

  // Helper for consistent account object structure across tests
  const mockAccountObject = { address: account.address, type: AccountType.SignerMnemonic } as const

  const sharedProviders: (EffectProviders | StaticProvider)[] = [
    [
      call(createTransactionServices, mockTransactionSagaDependencies, {
        account: mockAccountObject,
        chainId: CHAIN_ID,
        submitViaPrivateRpc: false,
        delegationType: DelegationType.Auto,
        request: mockSwapTxRequest,
        includeUserOpServices: false,
      }),
      {
        transactionSigner: mockTransactionSigner,
        transactionService: mockTransactionService,
      },
    ],
    [
      call(getShouldWaitBetweenTransactions, {
        swapper: account.address,
        chainId: CHAIN_ID,
        privateRpcAvailable: false,
      }),
      false,
    ],
    [call(getSwapTransactionCount, anySwapTransactionCountParams), 1],
  ]

  beforeAll(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => MOCK_TIMESTAMP)
    mockPrepareAndSignSwapSaga = vi.fn()
    executeSwapSaga = createExecuteSwapSaga(mockTransactionSagaDependencies, mockPrepareAndSignSwapSaga)
  })

  afterAll(() => {
    dateNowSpy.mockRestore()
  })

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    mockGetShouldWaitBetweenTransactions.mockResolvedValue(false)
    mockGetSwapTransactionCount.mockReturnValue(1)
    mockTransactionExecutor.executeStep.mockImplementation(function* () {
      yield call(vi.fn())
      return mockExecutionResult
    })
  })

  describe('Classic routing', () => {
    it('should execute a classic swap without approval', async () => {
      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext(),
      })

      await expectSaga(executeSwapSaga, params)
        .provide(sharedProviders)
        .put(
          pushNotification({
            type: AppNotificationType.SwapPending,
            wrapType: WrapType.NotApplicable,
          }),
        )
        .call(params.onSuccess)
        .not.call(params.onPending)
        .not.call(params.onFailure)
        .run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Swap,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Swap },
        }),
      })
    })

    it('should execute a classic swap with approval', async () => {
      const preSignedTransaction = preparePreSignedSwapTransaction({
        signedApproveTx: createMockSignedApproveTx(),
      })

      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          approveTxRequest: {
            to: '0xtoken',
            chainId: CHAIN_ID,
            data: '0x',
            value: '0',
            gasLimit: '21000',
            gasPrice: '20000000000',
          },
        }),
        preSignedTransaction,
      })

      await expectSaga(executeSwapSaga, params)
        .provide(sharedProviders)
        .put(
          pushNotification({
            type: AppNotificationType.SwapPending,
            wrapType: WrapType.NotApplicable,
          }),
        )
        .call(params.onSuccess)
        .not.call(params.onPending)
        .not.call(params.onFailure)
        .run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledTimes(2)
      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Approval,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Approve },
        }),
        shouldWait: false,
      })
      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Swap,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Swap },
        }),
      })
    })

    it('should call onFailure and log error when approval transaction fails', async () => {
      const preSignedTransaction = preparePreSignedSwapTransaction({
        signedApproveTx: createMockSignedApproveTx(),
      })

      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          approveTxRequest: {
            to: '0xtoken',
            chainId: CHAIN_ID,
            data: '0x',
            value: '0',
            gasLimit: '21000',
            gasPrice: '20000000000',
          },
        }),
        preSignedTransaction,
      })

      mockTransactionExecutor.executeStep.mockImplementationOnce(function* () {
        yield call(vi.fn())
        return mockFailedExecutionResult
      })

      await expectSaga(executeSwapSaga, params).provide(sharedProviders).call(params.onFailure).run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Approval,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Approve },
        }),
        shouldWait: false,
      })

      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Approval transaction failed',
        }),
        expect.objectContaining({
          tags: { file: 'executeSwapSaga', function: 'executeSwap' },
          extra: { analytics: mockAnalytics },
        }),
      )
    })

    it('should call onFailure and log error when swap transaction fails', async () => {
      const params = prepareExecuteSwapSagaParams()

      mockTransactionExecutor.executeStep.mockImplementationOnce(function* () {
        yield call(vi.fn())
        return mockFailedExecutionResult
      })

      await expectSaga(executeSwapSaga, params)
        .provide([...sharedProviders])
        .call(params.onFailure)
        .run()

      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Transaction failed',
        }),
        expect.objectContaining({
          tags: { file: 'executeSwapSaga', function: 'executeSwap' },
          extra: { analytics: mockAnalytics },
        }),
      )
    })
  })

  describe('Wrap routing', () => {
    it('should execute a wrap transaction', async () => {
      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.WRAP,
          trade: mockWrapTrade,
        }),
      })

      await expectSaga(executeSwapSaga, params)
        .provide([...sharedProviders])
        .put(
          pushNotification({
            type: AppNotificationType.SwapPending,
            wrapType: WrapType.Wrap,
          }),
        )
        .call(params.onSuccess)
        .not.call(params.onPending)
        .not.call(params.onFailure)
        .run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Wrap,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Wrap },
        }),
      })
    })

    it('should execute a wrap transaction with approval', async () => {
      const preSignedTransaction = preparePreSignedSwapTransaction({
        signedApproveTx: createMockSignedApproveTx(),
      })

      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.WRAP,
          trade: mockWrapTrade,
          approveTxRequest: {
            to: '0xtoken',
            chainId: CHAIN_ID,
            data: '0x',
            value: '0',
            gasLimit: '21000',
            gasPrice: '20000000000',
          },
        }),
        preSignedTransaction,
      })

      await expectSaga(executeSwapSaga, params)
        .provide(sharedProviders)
        .put(
          pushNotification({
            type: AppNotificationType.SwapPending,
            wrapType: WrapType.Wrap,
          }),
        )
        .call(params.onSuccess)
        .not.call(params.onPending)
        .not.call(params.onFailure)
        .run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledTimes(2)
      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Approval,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Approve },
        }),
        shouldWait: false,
      })
      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Wrap,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Wrap },
        }),
      })
    })

    it('should call onFailure and log error when approval transaction fails', async () => {
      const preSignedTransaction = preparePreSignedSwapTransaction({
        signedApproveTx: createMockSignedApproveTx(),
      })

      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.WRAP,
          trade: mockWrapTrade,
          approveTxRequest: {
            to: '0xtoken',
            chainId: CHAIN_ID,
            data: '0x',
            value: '0',
            gasLimit: '21000',
            gasPrice: '20000000000',
          },
        }),
        preSignedTransaction,
      })

      mockTransactionExecutor.executeStep.mockImplementationOnce(function* () {
        yield call(vi.fn())
        return mockFailedExecutionResult
      })

      await expectSaga(executeSwapSaga, params).provide(sharedProviders).call(params.onFailure).run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Approval,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Approve },
        }),
        shouldWait: false,
      })

      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Approval transaction failed',
        }),
        expect.objectContaining({
          tags: { file: 'executeSwapSaga', function: 'executeSwap' },
          extra: { analytics: mockAnalytics },
        }),
      )
    })

    it('should call onFailure and log error when wrap transaction fails', async () => {
      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.WRAP,
          trade: mockWrapTrade,
        }),
      })

      mockTransactionExecutor.executeStep.mockImplementationOnce(function* () {
        yield call(vi.fn())
        return mockFailedExecutionResult
      })

      await expectSaga(executeSwapSaga, params).provide(sharedProviders).call(params.onFailure).run()

      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Transaction failed',
        }),
        expect.objectContaining({
          tags: { file: 'executeSwapSaga', function: 'executeSwap' },
          extra: { analytics: mockAnalytics },
        }),
      )
    })
  })

  describe('UniswapX routing', () => {
    it('should execute a UniswapX order', async () => {
      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareUniswapXSwapTxContext(),
        preSignedTransaction: prepareUniswapXPreSignedSwapTransaction(),
      })

      await expectSaga(executeSwapSaga, params)
        .provide([...sharedProviders, [call(submitUniswapXOrder, anySubmitUniswapXOrderParams), undefined]])
        .call(params.onPending)
        .not.call(params.onSuccess)
        .not.call(params.onFailure)
        .run()

      expect(mockSubmitUniswapXOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          permit: {
            permit: mockPermit.typedData,
            signedData: '0xsignedPermit',
          },
          typeInfo: { type: TransactionType.Swap },
          quote: params.swapTxContext.trade.quote.quote,
          routing: TradingApi.Routing.DUTCH_V2,
          txId: 'test-tx-id',
          onSuccess: params.onSuccess,
          onFailure: params.onFailure,
        }),
      )
    })

    it('should execute a UniswapX order with approval', async () => {
      const preSignedTransaction = prepareUniswapXPreSignedSwapTransaction({
        signedSwapPermit: {
          permit: mockPermit.typedData,
          signedData: '0xsignedPermit',
        },
        signedApproveTx: createMockSignedApproveTx(),
      })

      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareUniswapXSwapTxContext(),
        preSignedTransaction,
      })

      await expectSaga(executeSwapSaga, params)
        .provide([...sharedProviders, [call(submitUniswapXOrder, anySubmitUniswapXOrderParams), undefined]])
        .call(params.onPending)
        .not.call(params.onSuccess)
        .not.call(params.onFailure)
        .run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledTimes(1)
      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Approval,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Approve },
        }),
        shouldWait: false,
      })
      expect(mockSubmitUniswapXOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          approveTxHash: '0xmockhash',
        }),
      )
    })

    it('should call onFailure and log error when approval transaction fails', async () => {
      const preSignedTransaction = prepareUniswapXPreSignedSwapTransaction({
        signedSwapPermit: {
          permit: mockPermit.typedData,
          signedData: '0xsignedPermit',
        },
        signedApproveTx: createMockSignedApproveTx(),
      })

      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareUniswapXSwapTxContext(),
        preSignedTransaction,
      })

      mockTransactionExecutor.executeStep.mockImplementationOnce(function* () {
        yield call(vi.fn())
        return mockFailedExecutionResult
      })

      await expectSaga(executeSwapSaga, params).provide(sharedProviders).call(params.onFailure).run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Approval,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Approve },
        }),
        shouldWait: false,
      })

      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Approval transaction failed',
        }),
        expect.objectContaining({
          tags: { file: 'executeSwapSaga', function: 'executeSwap' },
          extra: { analytics: mockAnalytics },
        }),
      )
    })
  })

  describe('Bridge routing', () => {
    it('should execute a bridge transaction', async () => {
      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.BRIDGE,
          trade: mockBridgeTrade,
        }),
      })

      await expectSaga(executeSwapSaga, params)
        .provide(sharedProviders)
        .put(
          pushNotification({
            type: AppNotificationType.SwapPending,
            wrapType: WrapType.NotApplicable,
          }),
        )
        .call(params.onSuccess)
        .not.call(params.onPending)
        .not.call(params.onFailure)
        .run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Swap,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Bridge },
        }),
      })
    })

    it('should execute a bridge transaction with approval', async () => {
      const preSignedTransaction = preparePreSignedSwapTransaction({
        signedApproveTx: createMockSignedApproveTx(),
      })

      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.BRIDGE,
          trade: mockBridgeTrade,
          approveTxRequest: {
            to: '0xtoken',
            chainId: CHAIN_ID,
            data: '0x',
            value: '0',
            gasLimit: '21000',
            gasPrice: '20000000000',
          },
        }),
        preSignedTransaction,
      })

      await expectSaga(executeSwapSaga, params)
        .provide(sharedProviders)
        .put(
          pushNotification({
            type: AppNotificationType.SwapPending,
            wrapType: WrapType.NotApplicable,
          }),
        )
        .call(params.onSuccess)
        .not.call(params.onPending)
        .not.call(params.onFailure)
        .run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledTimes(2)
      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Approval,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Approve },
        }),
        shouldWait: false,
      })
      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Swap,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Bridge },
        }),
      })
    })

    it('should call onFailure and log error when approval transaction fails', async () => {
      const preSignedTransaction = preparePreSignedSwapTransaction({
        signedApproveTx: createMockSignedApproveTx(),
      })

      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.BRIDGE,
          trade: mockBridgeTrade,
          approveTxRequest: {
            to: '0xtoken',
            chainId: CHAIN_ID,
            data: '0x',
            value: '0',
            gasLimit: '21000',
            gasPrice: '20000000000',
          },
        }),
        preSignedTransaction,
      })

      mockTransactionExecutor.executeStep.mockImplementationOnce(function* () {
        yield call(vi.fn())
        return mockFailedExecutionResult
      })

      await expectSaga(executeSwapSaga, params).provide(sharedProviders).call(params.onFailure).run()

      expect(mockTransactionExecutor.executeStep).toHaveBeenCalledWith({
        type: TransactionStepType.Approval,
        params: expect.objectContaining({
          typeInfo: { type: TransactionType.Approve },
        }),
        shouldWait: false,
      })

      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Approval transaction failed',
        }),
        expect.objectContaining({
          tags: { file: 'executeSwapSaga', function: 'executeSwap' },
          extra: { analytics: mockAnalytics },
        }),
      )
    })

    it('should call onFailure and log error when bridge transaction fails', async () => {
      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.BRIDGE,
          trade: mockBridgeTrade,
        }),
      })

      mockTransactionExecutor.executeStep.mockImplementationOnce(function* () {
        yield call(vi.fn())
        return mockFailedExecutionResult
      })

      await expectSaga(executeSwapSaga, params).provide(sharedProviders).call(params.onFailure).run()

      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Transaction failed',
        }),
        expect.objectContaining({
          tags: { file: 'executeSwapSaga', function: 'executeSwap' },
          extra: { analytics: mockAnalytics },
        }),
      )
    })
  })

  describe('Transaction spacing', () => {
    it('should call onPending when transaction spacing is required', async () => {
      const preSignedTransaction = preparePreSignedSwapTransaction({
        signedApproveTx: createMockSignedApproveTx(),
      })

      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.CLASSIC,
          trade: mockClassicTrade,
          approveTxRequest: {
            to: '0xtoken',
            chainId: CHAIN_ID,
            data: '0x',
            value: '0',
            gasLimit: '21000',
            gasPrice: '20000000000',
          },
        }),
        preSignedTransaction,
      })

      // Mock the transaction count to return 2 (this triggers delayed submission)
      mockGetSwapTransactionCount.mockReturnValue(2)

      await expectSaga(executeSwapSaga, params)
        .provide([
          [
            call(createTransactionServices, mockTransactionSagaDependencies, {
              account: mockAccountObject,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
              delegationType: DelegationType.Auto,
              request: mockSwapTxRequest,
              includeUserOpServices: false,
            }),
            {
              transactionSigner: mockTransactionSigner,
              transactionService: mockTransactionService,
            },
          ],
          [
            call(getShouldWaitBetweenTransactions, {
              swapper: account.address,
              chainId: CHAIN_ID,
              privateRpcAvailable: false,
            }),
            true,
          ],
        ])
        .call(params.onPending)
        .call(params.onSuccess)
        .not.call(params.onFailure)
        .run()
    })

    it('should call onSuccess immediately when no spacing is required', async () => {
      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          routing: TradingApi.Routing.CLASSIC,
          trade: mockClassicTrade,
        }),
      })

      await expectSaga(executeSwapSaga, params)
        .provide(sharedProviders)
        .call(params.onSuccess)
        .not.call(params.onPending)
        .not.call(params.onFailure)
        .run()
    })
  })

  describe('Prepare and sign integration', () => {
    it('should call prepareAndSignSwapTransaction when preSignedTransaction is not provided', async () => {
      const params = prepareExecuteSwapSagaParams({
        preSignedTransaction: undefined,
      })

      const mockPreSignedTransaction = preparePreSignedSwapTransaction()
      mockPrepareAndSignSwapSaga.mockResolvedValue(mockPreSignedTransaction)

      await expectSaga(executeSwapSaga, params)
        .provide([
          ...sharedProviders,
          [
            call(mockPrepareAndSignSwapSaga, {
              swapTxContext: params.swapTxContext,
              account: { address: params.address, type: AccountType.SignerMnemonic },
            }),
            mockPreSignedTransaction,
          ],
        ])
        .call(mockPrepareAndSignSwapSaga, {
          swapTxContext: params.swapTxContext,
          account: { address: params.address, type: AccountType.SignerMnemonic },
        })
        .call(params.onSuccess)
        .run()
    })

    it('should not call prepareAndSignSwapTransaction when preSignedTransaction is provided', async () => {
      const params = prepareExecuteSwapSagaParams()

      await expectSaga(executeSwapSaga, params).provide(sharedProviders).call(params.onSuccess).run()

      expect(mockPrepareAndSignSwapSaga).not.toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle and log errors without crashing', async () => {
      const params = prepareExecuteSwapSagaParams()

      mockTransactionExecutor.executeStep.mockImplementationOnce(function* () {
        yield call(vi.fn())
        throw new Error('Test error')
      })

      await expectSaga(executeSwapSaga, params).provide(sharedProviders).run()

      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: { file: 'executeSwapSaga', function: 'executeSwap' },
          extra: { analytics: mockAnalytics },
        }),
      )
    })

    it('should handle transaction service creation errors', async () => {
      const params = prepareExecuteSwapSagaParams()
      const error = new Error('Service creation failed')

      await expectSaga(executeSwapSaga, params)
        .provide([
          [
            call(createTransactionServices, mockTransactionSagaDependencies, {
              account: mockAccountObject,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
              delegationType: DelegationType.Auto,
              request: mockSwapTxRequest,
              includeUserOpServices: false,
            }),
            Promise.reject(error),
          ],
        ])
        .run()

      expect(mockTransactionSagaDependencies.logger.error).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: { file: 'executeSwapSaga', function: 'executeSwap' },
          extra: { analytics: mockAnalytics },
        }),
      )
    })
  })

  describe('SwapExecutionWindow telemetry (SWAP-2471)', () => {
    it('emits a start marker then an end marker for a successful swap', async () => {
      const params = prepareExecuteSwapSagaParams()

      await expectSaga(executeSwapSaga, params).provide(sharedProviders).run()

      const analyticsCalls = vi.mocked(sendAnalyticsEvent).mock.calls
      const windowCalls = analyticsCalls.filter(([name]) => name === WalletEventName.SwapExecutionWindow)
      expect(windowCalls).toHaveLength(2)
      expect(windowCalls[0]?.[1]).toEqual(
        expect.objectContaining({ saga: 'executeSwap', phase: 'start', address: params.address }),
      )
      expect(windowCalls[1]?.[1]).toEqual(
        expect.objectContaining({ saga: 'executeSwap', phase: 'end', address: params.address }),
      )
    })

    it('still emits the end marker when the swap throws (finally block)', async () => {
      const params = prepareExecuteSwapSagaParams()
      mockTransactionExecutor.executeStep.mockImplementationOnce(function* () {
        yield call(vi.fn())
        throw new Error('Test error')
      })

      await expectSaga(executeSwapSaga, params).provide(sharedProviders).run()

      expect(vi.mocked(sendAnalyticsEvent)).toHaveBeenCalledWith(
        WalletEventName.SwapExecutionWindow,
        expect.objectContaining({ saga: 'executeSwap', phase: 'end' }),
      )
    })
  })

  describe('Approval transaction parameters', () => {
    it('should not include swap txId in approval transaction data', async () => {
      const preSignedTransaction = preparePreSignedSwapTransaction({
        signedApproveTx: {
          ...createMockSignedApproveTx(),
          txId: 'test-tx-id',
        },
      })

      const params = prepareExecuteSwapSagaParams({
        swapTxContext: prepareSwapTxContext({
          approveTxRequest: {
            to: '0xtoken',
            chainId: CHAIN_ID,
            data: '0x',
            value: '0',
            gasLimit: '21000',
            gasPrice: '20000000000',
          },
        }),
        preSignedTransaction,
      })

      // Mock the transaction factory to capture the approval data
      const mockCreateApprovalParams = vi.fn().mockReturnValue({
        typeInfo: { type: TransactionType.Approve },
        chainId: CHAIN_ID,
        account: { address: params.address, type: AccountType.SignerMnemonic },
      })

      const mockDependencies = {
        ...mockTransactionSagaDependencies,
        createTransactionParamsFactory: vi.fn().mockReturnValue({
          ...mockTransactionParamsFactory,
          createApprovalParams: mockCreateApprovalParams,
        }),
      }

      const customExecuteSwapSaga = createExecuteSwapSaga(mockDependencies, mockPrepareAndSignSwapSaga)

      await expectSaga(customExecuteSwapSaga, params)
        .provide([
          [
            call(createTransactionServices, mockDependencies, {
              account: mockAccountObject,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: false,
              delegationType: DelegationType.Auto,
              request: mockSwapTxRequest,
              includeUserOpServices: false,
            }),
            {
              transactionSigner: mockTransactionSigner,
              transactionService: mockTransactionService,
            },
          ],
          [
            call(getShouldWaitBetweenTransactions, {
              swapper: account.address,
              chainId: CHAIN_ID,
              privateRpcAvailable: false,
            }),
            false,
          ],
          [call(getSwapTransactionCount, anySwapTransactionCountParams), 1],
        ])
        .call(params.onSuccess)
        .run()

      // Verify createApprovalParams was called with data that doesn't include txId
      expect(mockCreateApprovalParams).toHaveBeenCalledWith({
        signedTx: preSignedTransaction.signedApproveTx,
        gasEstimate: undefined, // No gas estimate in this test scenario
        swapTxId: 'test-tx-id', // This is the swapTxId passed to the params
      })

      // Verify the approval data passed doesn't have txId property
      const approvalDataCall = mockCreateApprovalParams.mock.calls[0]?.[0]
      expect(approvalDataCall).toBeTruthy()
      expect(approvalDataCall).not.toHaveProperty('txId')
    })
  })

  describe('Private RPC support', () => {
    it('should use private RPC when enabled', async () => {
      const preSignedTransaction = preparePreSignedSwapTransaction({
        metadata: {
          submitViaPrivateRpc: true,
          timestampBeforeSign: MOCK_TIMESTAMP,
          timestampAfterSign: MOCK_TIMESTAMP,
        },
      })

      const params = prepareExecuteSwapSagaParams({
        preSignedTransaction,
      })

      mockGetSwapTransactionCount.mockReturnValue(1)

      await expectSaga(executeSwapSaga, params)
        .provide([
          [
            call(createTransactionServices, mockTransactionSagaDependencies, {
              account: mockAccountObject,
              chainId: CHAIN_ID,
              submitViaPrivateRpc: true,
              delegationType: DelegationType.Auto,
              request: mockSwapTxRequest,
              includeUserOpServices: false,
            }),
            {
              transactionSigner: mockTransactionSigner,
              transactionService: mockTransactionService,
            },
          ],
          [
            call(getShouldWaitBetweenTransactions, {
              swapper: account.address,
              chainId: CHAIN_ID,
              privateRpcAvailable: true,
            }),
            false,
          ],
        ])
        .call(createTransactionServices, mockTransactionSagaDependencies, {
          account: mockAccountObject,
          chainId: CHAIN_ID,
          submitViaPrivateRpc: true,
          delegationType: DelegationType.Auto,
          request: mockSwapTxRequest,
          includeUserOpServices: false,
        })
        .call(params.onSuccess)
        .run()
    })
  })
})

describe('Sync transaction submission', () => {
  let executeSwapSaga: ReturnType<typeof createExecuteSwapSaga>
  let mockPrepareAndSignSwapSaga: Mock

  // Helper for consistent account object structure across tests
  const mockAccountObject = { address: account.address, type: AccountType.SignerMnemonic } as const

  beforeAll(() => {
    mockPrepareAndSignSwapSaga = vi.fn()
    executeSwapSaga = createExecuteSwapSaga(mockTransactionSagaDependencies, mockPrepareAndSignSwapSaga)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetShouldWaitBetweenTransactions.mockResolvedValue(false)
    mockGetSwapTransactionCount.mockReturnValue(1)
  })

  it('should have executeStepSync method available on transaction executor', () => {
    // Verify that the transaction executor has the sync execution method
    expect(mockTransactionExecutor.executeStepSync).toBeDefined()
    expect(typeof mockTransactionExecutor.executeStepSync).toBe('function')
  })

  it('should execute classic swap using async execution by default', async () => {
    const params = prepareExecuteSwapSagaParams({
      swapTxContext: prepareSwapTxContext(),
    })

    mockTransactionExecutor.executeStep.mockImplementation(function* () {
      yield call(vi.fn())
      return mockExecutionResult
    })

    await expectSaga(executeSwapSaga, params)
      .provide([
        [
          call(createTransactionServices, mockTransactionSagaDependencies, {
            account: mockAccountObject,
            chainId: CHAIN_ID,
            submitViaPrivateRpc: false,
            delegationType: DelegationType.Auto,
            request: mockSwapTxRequest,
            includeUserOpServices: false,
          }),
          {
            transactionSigner: mockTransactionSigner,
            transactionService: mockTransactionService,
          },
        ],
        [
          call(getShouldWaitBetweenTransactions, {
            swapper: account.address,
            chainId: CHAIN_ID,
            privateRpcAvailable: false,
          }),
          false,
        ],
        [call(getSwapTransactionCount, anySwapTransactionCountParams), 1],
      ])
      .call(params.onSuccess)
      .run()

    // By default, should use async execution
    expect(mockTransactionExecutor.executeStep).toHaveBeenCalled()
    // Sync execution should not be called by default (since config is empty by default)
    expect(mockTransactionExecutor.executeStepSync).not.toHaveBeenCalled()
  })
})
