import { BigNumber } from 'ethers'
import { call, SagaGenerator } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { TransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import { waitForTransactionConfirmation } from 'wallet/src/features/transactions/swap/confirmation'
import {
  TransactionExecutionResult,
  TransactionExecutionSyncResult,
  TransactionStep,
} from 'wallet/src/features/transactions/swap/types/transactionExecutor'

/**
 * Interface for unified transaction executor that handles submission and spacing for all transaction types
 */
export interface TransactionExecutor {
  /**
   * Execute a single transaction step
   */
  executeStep(step: TransactionStep): SagaGenerator<TransactionExecutionResult>

  /**
   * Execute a single transaction step synchronously, returning the receipt
   */
  executeStepSync(step: TransactionStep): SagaGenerator<TransactionExecutionSyncResult>

  /**
   * Execute multiple transaction steps in sequence
   */
  executeSteps(steps: TransactionStep[]): SagaGenerator<TransactionExecutionResult[]>
}

/**
 * Factory function to create a unified transaction executor that handles submission and spacing for all transaction types
 */
export function createTransactionExecutor(transactionService: TransactionService): TransactionExecutor {
  /**
   * Execute a single transaction step
   */
  function* executeStep(step: TransactionStep): SagaGenerator<TransactionExecutionResult> {
    try {
      const { params, shouldWait } = step

      const result = yield* call(transactionService.submitTransaction, params)
      const hash = result.transactionHash

      // SWAP-2471: capture per-step submit timing + the assigned nonce so the inter-submit gap
      // between an approval and its swap (the gapped-nonce window) is measurable in prod.
      logger.info('transactionExecutor', 'executeStep', 'Step submitted', {
        stepType: step.type,
        txId: params.txId,
        chainId: params.chainId,
        nonce:
          params.request?.request.nonce !== undefined
            ? BigNumber.from(params.request.request.nonce).toNumber()
            : undefined,
        shouldWait,
        hash,
        submittedAtMs: Date.now(),
      })

      // Handle transaction spacing if required
      if (shouldWait) {
        const { success } = yield* call(waitForTransactionConfirmation, { hash })

        if (!success) {
          throw new Error(`Transaction spacing failed for ${step.type} transaction`)
        }
      }

      return { hash, success: true }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'transactionExecutor', function: 'executeStep' },
        extra: { stepType: step.type },
      })
      return { error, success: false }
    }
  }

  /**
   * Execute a single transaction step synchronously, returning the receipt
   */
  function* executeStepSync(step: TransactionStep): SagaGenerator<TransactionExecutionSyncResult> {
    try {
      const { params } = step

      const transaction = yield* call(transactionService.submitTransactionSync, params)

      return { transaction, success: true }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'transactionExecutor', function: 'executeStepSync' },
        extra: { stepType: step.type },
      })
      return { error, success: false }
    }
  }

  /**
   * Execute multiple transaction steps in sequence
   */
  function* executeSteps(steps: TransactionStep[]): SagaGenerator<TransactionExecutionResult[]> {
    const results: TransactionExecutionResult[] = []

    for (const step of steps) {
      const result = yield* executeStep(step)
      results.push(result)

      // Stop execution if any step fails
      if (!result.success) {
        throw new Error(`Transaction step ${step.type} failed, stopping execution`)
      }
    }

    return results
  }

  return {
    executeStep,
    executeStepSync,
    executeSteps,
  }
}
