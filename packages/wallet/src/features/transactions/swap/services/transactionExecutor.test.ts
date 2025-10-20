import { call } from '@redux-saga/core/effects'
import { TradeType } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { dynamic } from 'redux-saga-test-plan/providers'
import {
  ExactInputSwapTransactionInfo,
  TransactionOriginType,
  TransactionType,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ensure0xHex } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'
import { TransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import { waitForTransactionConfirmation } from 'wallet/src/features/transactions/swap/confirmation'
import {
  createTransactionExecutor,
  TransactionExecutor,
} from 'wallet/src/features/transactions/swap/services/transactionExecutor'
import { TransactionStep, TransactionStepType } from 'wallet/src/features/transactions/swap/types/transactionExecutor'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

// Mock dependencies
jest.mock('utilities/src/logger/logger')
jest.mock('wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService')
jest.mock('wallet/src/features/transactions/swap/confirmation')

const mockTransactionService = {
  submitTransaction: jest.fn(),
  submitTransactionSync: jest.fn(),
  prepareAndSignTransaction: jest.fn(),
  executeTransaction: jest.fn(),
  getNextNonce: jest.fn(),
} as jest.Mocked<TransactionService>

const mockLogger = logger as jest.Mocked<typeof logger>

describe('TransactionExecutor', () => {
  let executor: TransactionExecutor
  const MOCK_TIMESTAMP = 1487076708000
  const account = signerMnemonicAccount()

  // Shared mocks for all tests
  const mockSignedTransactionRequest = {
    request: {
      data: '0x',
      to: '0xAddress',
      from: '0xFromAddress',
      value: BigNumber.from('0'),
      gasLimit: BigNumber.from('21000'),
      gasPrice: BigNumber.from('20000000000'),
      nonce: 1,
      chainId: 1,
    },
    signedRequest: ensure0xHex('0xsignedTxData'),
    timestampBeforeSign: MOCK_TIMESTAMP,
  }

  const mockSwapTypeInfo: ExactInputSwapTransactionInfo = {
    type: TransactionType.Swap,
    tradeType: TradeType.EXACT_INPUT,
    inputCurrencyId: 'ETH',
    outputCurrencyId: 'USDC',
    inputCurrencyAmountRaw: '1000000000000000000',
    expectedOutputCurrencyAmountRaw: '1000000000',
    minimumOutputCurrencyAmountRaw: '950000000',
  }

  const createMockStep = (options: {
    type: TransactionStepType
    shouldWait?: boolean
    typeInfo?: ExactInputSwapTransactionInfo | WrapTransactionInfo
  }): TransactionStep => ({
    type: options.type,
    shouldWait: options.shouldWait || false,
    params: {
      request: mockSignedTransactionRequest,
      account,
      chainId: 1,
      options: {
        request: mockSignedTransactionRequest.request,
        submitViaPrivateRpc: false,
        userSubmissionTimestampMs: MOCK_TIMESTAMP,
      },
      typeInfo: options.typeInfo || mockSwapTypeInfo,
      transactionOriginType: TransactionOriginType.Internal,
      analytics: undefined,
    },
  })

  const createMockSubmitResult = (hash: string): { transactionHash: string } => {
    return {
      transactionHash: hash,
    }
  }

  beforeEach(() => {
    executor = createTransactionExecutor(mockTransactionService)
    jest.clearAllMocks()
  })

  describe('executeStep', () => {
    it('should execute a single step successfully without waiting', async () => {
      const step = createMockStep({ type: TransactionStepType.Swap })

      const result = await expectSaga(executor.executeStep.bind(executor), step)
        .provide([[call(mockTransactionService.submitTransaction, step.params), createMockSubmitResult('0x123abc')]])
        .run()

      expect(result.returnValue).toEqual({
        hash: '0x123abc',
        success: true,
      })
    })

    it('should execute a single step successfully with waiting', async () => {
      const step = createMockStep({ type: TransactionStepType.Swap, shouldWait: true })

      const result = await expectSaga(executor.executeStep.bind(executor), step)
        .provide([
          [call(mockTransactionService.submitTransaction, step.params), createMockSubmitResult('0x123abc')],
          [call(waitForTransactionConfirmation, { hash: '0x123abc' }), { success: true }],
        ])
        .run()

      expect(result.returnValue).toEqual({
        hash: '0x123abc',
        success: true,
      })
    })

    it('should handle transaction spacing failure', async () => {
      const step = createMockStep({ type: TransactionStepType.Swap, shouldWait: true })

      const result = await expectSaga(executor.executeStep.bind(executor), step)
        .provide([
          [
            call(mockTransactionService.submitTransaction, step.params),
            Promise.resolve(createMockSubmitResult('0x123abc')),
          ],
          [call(waitForTransactionConfirmation, { hash: '0x123abc' }), { success: false }],
        ])
        .run()

      expect(result.returnValue).toEqual({
        error: new Error('Transaction spacing failed for swap transaction'),
        success: false,
      })
      expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), {
        tags: { file: 'transactionExecutor', function: 'executeStep' },
        extra: { stepType: TransactionStepType.Swap },
      })
    })

    it('should handle transaction submission failure', async () => {
      const step = createMockStep({ type: TransactionStepType.Swap })
      const submitError = new Error('Submission failed')

      const result = await expectSaga(executor.executeStep.bind(executor), step)
        .provide([[call(mockTransactionService.submitTransaction, step.params), Promise.reject(submitError)]])
        .run()

      expect(result.returnValue).toEqual({
        error: submitError,
        success: false,
      })
      expect(mockLogger.error).toHaveBeenCalledWith(submitError, {
        tags: { file: 'transactionExecutor', function: 'executeStep' },
        extra: { stepType: TransactionStepType.Swap },
      })
    })
  })

  describe('executeSteps', () => {
    it('should execute multiple steps successfully', async () => {
      const steps = [
        createMockStep({ type: TransactionStepType.Permit }),
        createMockStep({ type: TransactionStepType.Swap }),
      ]

      let callCount = 0
      const dynamicSubmitTransaction = (): { transactionHash: string } => {
        callCount++
        if (callCount === 1) {
          return createMockSubmitResult('0x111')
        } else {
          return createMockSubmitResult('0x222')
        }
      }

      const result = await expectSaga(executor.executeSteps.bind(executor), steps)
        .provide([[matchers.call.fn(mockTransactionService.submitTransaction), dynamic(dynamicSubmitTransaction)]])
        .run()

      expect(result.returnValue).toEqual([
        { hash: '0x111', success: true },
        { hash: '0x222', success: true },
      ])
    })

    it('should stop execution when a step fails', async () => {
      const steps = [
        createMockStep({ type: TransactionStepType.Permit }),
        createMockStep({ type: TransactionStepType.Swap }),
      ]

      const submitError = new Error('First step failed')

      await expect(
        expectSaga(executor.executeSteps.bind(executor), steps)
          .provide([[call(mockTransactionService.submitTransaction, steps[0]!.params), Promise.reject(submitError)]])
          .run(),
      ).rejects.toThrow('Transaction step permit failed, stopping execution')

      expect(mockLogger.error).toHaveBeenCalledWith(submitError, {
        tags: { file: 'transactionExecutor', function: 'executeStep' },
        extra: { stepType: TransactionStepType.Permit },
      })
    })

    it('should handle empty steps array', async () => {
      const result = await expectSaga(executor.executeSteps.bind(executor), []).run()

      expect(result.returnValue).toEqual([])
    })

    it('should execute steps with spacing requirements', async () => {
      const steps = [
        createMockStep({ type: TransactionStepType.Permit, shouldWait: true }),
        createMockStep({ type: TransactionStepType.Swap, shouldWait: false }),
      ]

      let callCount = 0
      const dynamicSubmitTransaction = (): { transactionHash: string } => {
        callCount++
        if (callCount === 1) {
          return createMockSubmitResult('0x111')
        } else {
          return createMockSubmitResult('0x222')
        }
      }

      const result = await expectSaga(executor.executeSteps.bind(executor), steps)
        .provide([
          [matchers.call.fn(mockTransactionService.submitTransaction), dynamic(dynamicSubmitTransaction)],
          [call(waitForTransactionConfirmation, { hash: '0x111' }), { success: true }],
        ])
        .run()

      expect(result.returnValue).toEqual([
        { hash: '0x111', success: true },
        { hash: '0x222', success: true },
      ])
    })
  })
})
