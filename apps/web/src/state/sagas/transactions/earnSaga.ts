import { TradingApi } from '@universe/api'
import { call, type SagaGenerator } from 'typed-redux-saga'
import type {
  HandleSwapStepSyncParams,
  HandleSwapWalletCallStepParams,
  HandleOnChainStepParams,
  OnChainTransactionStep,
  OnChainTransactionStepWalletCall,
} from 'uniswap/src/features/transactions/steps/types'
import { TransactionType, type TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { handleAtomicSendCalls } from '~/state/sagas/transactions/5792'
import { handleOnChainStep, waitForBatch } from '~/state/sagas/transactions/utils'

const EARN_TRANSACTION_INFO: TransactionTypeInfo = {
  // Plan activity carries the user-facing deposit/withdraw labels; individual wallet steps stay generic.
  type: TransactionType.Unknown,
}

export function* handleEarnPlanTransactionStep(
  params: HandleSwapStepSyncParams<TradingApi.PlanStep>,
): SagaGenerator<string> {
  const onChainParams: HandleOnChainStepParams<OnChainTransactionStep> = {
    ...params,
    info: EARN_TRANSACTION_INFO,
    ignoreInterrupt: true,
    shouldWaitForConfirmation: params.shouldWaitForConfirmation ?? false,
  }

  return yield* call(handleOnChainStep, onChainParams)
}

export function* handleEarnPlanWalletCallStep(
  params: HandleSwapWalletCallStepParams,
): SagaGenerator<{ batchId: string; hash?: string }> {
  const batchId = yield* call(handleAtomicSendCalls, {
    ...params,
    info: EARN_TRANSACTION_INFO,
    step: params.step as OnChainTransactionStepWalletCall,
    ignoreInterrupt: true,
    shouldWaitForConfirmation: false,
  })

  const hash = yield* call(waitForBatch, batchId, params.step)
  if (!hash) {
    throw new Error('No hash found for earn wallet call step')
  }
  return { batchId, hash }
}
