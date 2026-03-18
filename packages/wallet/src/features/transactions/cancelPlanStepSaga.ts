import { providers } from 'ethers'
import { call, put, type SagaGenerator, select } from 'typed-redux-saga'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { CANCELLATION_TX_VALUE } from 'uniswap/src/features/gas/utils/cancel'
import { CancelableStepInfo } from 'uniswap/src/features/transactions/hooks/useIsCancelable'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import {
  PlanTransactionDetails,
  TransactionDetails,
  TransactionOriginType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { signalPlanCancellation } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import {
  ExecuteTransactionParams,
  executeTransaction,
} from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { Account, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'

/**
 * Gets the signer account for a given address after validating and checksumming.
 * Throws if the address is invalid or the account is not a signer.
 */
function* getSignerAccount(params: {
  address: string
  chainId: number
  errorContext: string
}): SagaGenerator<SignerMnemonicAccount> {
  const { address, chainId, errorContext } = params
  const accounts: Record<string, Account> = yield* select(selectAccounts)
  const checksummedAddress = getValidAddress({
    address,
    chainId,
    withEVMChecksum: true,
    log: false,
  })
  if (!checksummedAddress) {
    throw new Error(`Cannot ${errorContext}, invalid address: ${address}`)
  }
  const account = accounts[checksummedAddress]

  if (!account || account.type !== AccountType.SignerMnemonic) {
    throw new Error(`Cannot ${errorContext}, account missing or not signer: ${address}`)
  }
  return account
}

interface CancelPlanStepParams {
  planTransaction: PlanTransactionDetails
  cancelRequest: providers.TransactionRequest
  cancelableStepInfo: CancelableStepInfo
}

/**
 * Saga to cancel a step within a plan.
 *
 * Step transactions have empty `options.request` fields (no nonce).
 * For classic steps, we must fetch the nonce from chain using the transaction hash.
 *
 * For classic/bridge steps:
 * - Fetches transaction from chain to get nonce
 * - Uses transaction replacement (same nonce, higher gas, 0 value)
 *
 * For UniswapX steps:
 * - Submits permit2 nonce invalidation transaction
 *
 * After cancellation attempt:
 * - Signals plan cancellation to stop saga from executing future steps
 * - Force-refreshes plan status from Trading API
 * - Updates local state with new plan status
 */
export function* cancelPlanStep(params: CancelPlanStepParams) {
  const { planTransaction, cancelRequest, cancelableStepInfo } = params
  const { planId } = planTransaction.typeInfo
  const { step, stepIndex, cancellationType } = cancelableStepInfo

  logger.debug('cancelPlanStepSaga', 'cancelPlanStep', 'Attempting to cancel plan step', {
    planId,
    stepIndex,
    cancellationType,
    stepHash: step.hash,
    orderId: cancelableStepInfo.orderId,
  })

  // Mark plan as cancelled to stop saga from executing future steps
  activePlanStore.getState().actions.markPlanCancelled(planId)

  // Signal cancellation to interrupt watchPlanStep if it's waiting
  yield* put(signalPlanCancellation({ planId }))

  try {
    if (cancellationType === 'classic') {
      yield* call(cancelClassicPlanStep, {
        planTransaction,
        step,
        cancelRequest,
      })
    } else {
      if (!cancelableStepInfo.orderId) {
        throw new Error('Cannot cancel UniswapX step without orderId')
      }
      yield* call(cancelUniswapXPlanStep, {
        planTransaction,
        cancelRequest,
        orderId: cancelableStepInfo.orderId,
      })
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'cancelPlanStepSaga', function: 'cancelPlanStep' },
      extra: { planId, stepIndex, cancellationType },
    })
  }
}

/**
 * Cancels a classic/bridge step by fetching nonce from chain and submitting replacement tx.
 *
 * Step transactions have `options.request = {}` (empty).
 * We must fetch the transaction from chain to get the nonce for replacement.
 */
function* cancelClassicPlanStep(params: {
  planTransaction: PlanTransactionDetails
  step: TransactionDetails
  cancelRequest: providers.TransactionRequest
}) {
  const { planTransaction, step, cancelRequest } = params

  if (!step.hash) {
    throw new Error('Cannot cancel step without hash')
  }

  // Fetch the transaction from chain to get the nonce
  const provider = yield* call(getProvider, step.chainId)
  const chainTx = yield* call([provider, provider.getTransaction], step.hash)

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- getTransaction can return null
  if (!chainTx) {
    // Transaction not found - was likely dropped from mempool or never broadcast
    logger.warn('cancelPlanStepSaga', 'cancelClassicPlanStep', 'Transaction not found on chain', {
      hash: step.hash,
      chainId: step.chainId,
    })
    throw new Error(`Transaction ${step.hash} not found on chain - may have been dropped`)
  }

  // Check if transaction is already mined
  if (chainTx.blockNumber) {
    logger.debug('cancelPlanStepSaga', 'cancelClassicPlanStep', 'Transaction already mined, cannot cancel', {
      hash: step.hash,
      blockNumber: chainTx.blockNumber,
    })
    throw new Error(`Transaction ${step.hash} already mined, cannot cancel`)
  }

  const account = yield* call(getSignerAccount, {
    address: planTransaction.from,
    chainId: step.chainId,
    errorContext: 'cancel transaction',
  })

  // Build the replacement transaction with the fetched nonce
  // The cancelRequest already has adjusted gas fees from usePlanCancellationGasFeeInfo
  const replacementRequest: providers.TransactionRequest = {
    ...cancelRequest,
    from: chainTx.from,
    to: chainTx.from, // Self-send for cancellation
    nonce: chainTx.nonce,
    value: CANCELLATION_TX_VALUE,
  }

  logger.debug('cancelPlanStepSaga', 'cancelClassicPlanStep', 'Submitting replacement transaction', {
    originalHash: step.hash,
    nonce: chainTx.nonce,
    from: chainTx.from,
  })

  const executeTransactionParams: ExecuteTransactionParams = {
    chainId: step.chainId,
    account,
    options: {
      request: replacementRequest,
    },
    transactionOriginType: TransactionOriginType.Internal,
  }

  // Submit the replacement transaction
  const { transactionHash } = yield* call(executeTransaction, executeTransactionParams)

  logger.debug('cancelPlanStepSaga', 'cancelClassicPlanStep', 'Replacement transaction submitted', {
    originalHash: step.hash,
    replacementHash: transactionHash,
    nonce: chainTx.nonce,
  })
}

/**
 * Cancels a UniswapX order step by submitting a permit2 nonce invalidation transaction
 */
function* cancelUniswapXPlanStep(params: {
  planTransaction: PlanTransactionDetails
  cancelRequest: providers.TransactionRequest
  orderId: string
}) {
  const { planTransaction, cancelRequest, orderId } = params

  const account = yield* call(getSignerAccount, {
    address: planTransaction.from,
    chainId: planTransaction.chainId,
    errorContext: 'cancel UniswapX order',
  })

  const executeTransactionParams: ExecuteTransactionParams = {
    chainId: planTransaction.chainId,
    account,
    options: {
      request: cancelRequest,
    },
    transactionOriginType: TransactionOriginType.Internal,
  }

  // Submit the permit2 invalidation transaction
  yield* call(executeTransaction, executeTransactionParams)

  logger.debug('cancelPlanStepSaga', 'cancelUniswapXPlanStep', 'Permit2 invalidation submitted', {
    orderId,
    planId: planTransaction.typeInfo.planId,
  })
}
