import { DynamicConfigs, getDynamicConfigValue, SyncTransactionSubmissionChainIdsConfigKey } from '@universe/gating'
import { call, put } from 'typed-redux-saga'
import type { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import type { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { FLASHBLOCKS_UI_SKIP_ROUTES } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
import { getIsFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import type {
  SwapGasFeeEstimation,
  ValidatedSwapTxContext,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx } from 'uniswap/src/features/transactions/types/utils'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import type { Logger } from 'utilities/src/logger/logger'
import { apolloClientRef } from 'wallet/src/data/apollo/usePersistedApolloClient'
import { createTransactionServices } from 'wallet/src/features/transactions/factories/createTransactionServices'
import {
  getShouldWaitBetweenTransactions,
  getSwapTransactionCount,
} from 'wallet/src/features/transactions/swap/confirmation'
import type { createPrepareAndSignSwapSaga } from 'wallet/src/features/transactions/swap/prepareAndSignSwapSaga'
import type { TransactionExecutor } from 'wallet/src/features/transactions/swap/services/transactionExecutor'
import type {
  ApprovalTransactionData,
  PermitTransactionData,
  SwapTransactionData,
  TransactionParamsFactory,
  UniswapXOrderTransactionData,
  WrapTransactionData,
} from 'wallet/src/features/transactions/swap/services/transactionParamsFactory'
import { submitUniswapXOrder } from 'wallet/src/features/transactions/swap/submitOrderSaga'
import {
  isUniswapXPreSignedSwapTransaction,
  type PreSignedSwapTransaction,
} from 'wallet/src/features/transactions/swap/types/preSignedTransaction'
import {
  type BaseTransactionContext,
  type TransactionExecutionSyncResultSuccess,
  type TransactionStep,
  TransactionStepType,
} from 'wallet/src/features/transactions/swap/types/transactionExecutor'
import {
  DelegationType,
  type TransactionSagaDependencies,
} from 'wallet/src/features/transactions/types/transactionSagaDependencies'
import { finalizeTransaction } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'

export type SwapParams = {
  txId?: string
  account: SignerMnemonicAccountMeta
  analytics: SwapTradeBaseProperties
  swapTxContext: ValidatedSwapTxContext
  onSuccess: () => void
  onFailure: () => void
  onPending: () => void
  preSignedTransaction?: PreSignedSwapTransaction
}

/**
 * Helper function to handle approval transaction execution
 */
function* executeApprovalStep(params: {
  preSignedTransaction: PreSignedSwapTransaction
  factory: TransactionParamsFactory
  executor: TransactionExecutor
  gasFeeEstimation: SwapGasFeeEstimation
  shouldWait: boolean
  swapTxId?: string
  onFailure: () => void
}) {
  if (!params.preSignedTransaction.signedApproveTx) {
    return undefined
  }

  const approvalData: ApprovalTransactionData = {
    signedTx: params.preSignedTransaction.signedApproveTx,
    gasEstimate: params.gasFeeEstimation.approvalEstimate,
    swapTxId: params.swapTxId,
  }

  const approvalParams = params.factory.createApprovalParams(approvalData)
  const approvalStep: TransactionStep = {
    type: TransactionStepType.Approval,
    params: approvalParams,
    shouldWait: params.shouldWait,
  }

  const result = yield* params.executor.executeStep(approvalStep)
  if (!result.success) {
    yield* call(params.onFailure)
    throw new Error('Approval transaction failed')
  }
  return result.hash
}

/**
 * Helper function to handle permit transaction execution
 */
function* executePermitStep(params: {
  preSignedTransaction: PreSignedSwapTransaction
  factory: TransactionParamsFactory
  executor: TransactionExecutor
  shouldWait: boolean
  onFailure: () => void
}) {
  if (!params.preSignedTransaction.signedPermitTx) {
    return
  }

  const permitData: PermitTransactionData = {
    signedTx: params.preSignedTransaction.signedPermitTx,
  }

  const permitParams = params.factory.createPermitParams(permitData)
  const permitStep: TransactionStep = {
    type: TransactionStepType.Permit,
    params: permitParams,
    shouldWait: params.shouldWait,
  }

  const result = yield* params.executor.executeStep(permitStep)
  if (!result.success) {
    yield* call(params.onFailure)
    throw new Error('Permit transaction failed')
  }
}

/**
 * Helper function to execute a transaction step with sync/async fallback behavior
 */
function* executeTransactionStep(params: {
  executor: TransactionExecutor
  step: TransactionStep
  chainId: UniverseChainId
  logger: Logger
  onFailure: () => void
}) {
  const { executor, step, chainId, logger, onFailure } = params

  if (shouldUseSyncSwapSubmission(chainId)) {
    try {
      const syncResult = yield* executor.executeStepSync(step)
      if (syncResult.success) {
        return syncResult
      }
      // If sync execution failed, log and fall back to async execution
      logger.error(syncResult.error, {
        tags: { file: 'executeSwapSaga', function: 'executeTransactionStep' },
        extra: { chainId, step },
      })
    } catch (error) {
      // If sync execution threw an error, log and fall back to async execution
      logger.error(error, {
        tags: { file: 'executeSwapSaga', function: 'executeTransactionStep' },
        extra: { chainId, step },
      })
    }
  }

  // Execute async (either because sync is not enabled or sync failed)
  const asyncResult = yield* executor.executeStep(step)
  if (!asyncResult.success) {
    yield* call(onFailure)
    throw new Error('Transaction failed')
  }

  return undefined // Async execution doesn't return a sync result
}

/**
 * Factory function that creates an execute swap saga with injected dependencies
 */
export function createExecuteSwapSaga(
  dependencies: TransactionSagaDependencies,
  prepareAndSignSwapTransaction: ReturnType<typeof createPrepareAndSignSwapSaga>,
) {
  return function* executeSwap(params: SwapParams) {
    const userSubmissionTimestampMs = Date.now()
    try {
      const { account, txId, analytics, onSuccess, onFailure, onPending, swapTxContext } = params

      const preSignedTransaction =
        params.preSignedTransaction ||
        (yield* call(prepareAndSignSwapTransaction, {
          swapTxContext,
          account,
        }))

      const chainId = preSignedTransaction.chainId
      const submitViaPrivateRpc = preSignedTransaction.metadata.submitViaPrivateRpc
      const { transactionService } = yield* call(createTransactionServices, dependencies, {
        account,
        chainId,
        submitViaPrivateRpc,
        delegationType: swapTxContext.includesDelegation ? DelegationType.Delegate : DelegationType.Auto,
        request: 'txRequests' in swapTxContext ? swapTxContext.txRequests?.[0] : undefined,
      })

      // Create base context for transaction factory
      const context: BaseTransactionContext = {
        chainId,
        account,
        submitViaPrivateRpc,
        userSubmissionTimestampMs,
        timestampBeforeSign: preSignedTransaction.metadata.timestampBeforeSign,
        analytics,
      }

      const factory = dependencies.createTransactionParamsFactory(context)
      const executor = dependencies.createTransactionExecutor(transactionService)

      const shouldWait = yield* call(getShouldWaitBetweenTransactions, {
        swapper: account.address,
        chainId,
        privateRpcAvailable: submitViaPrivateRpc,
      })
      const swapTxHasDelayedSubmission = shouldWait && getSwapTransactionCount(swapTxContext) > 1

      if (isUniswapXPreSignedSwapTransaction(preSignedTransaction) || swapTxHasDelayedSubmission) {
        yield* call(onPending)
      } else {
        yield* call(onSuccess)
      }

      const gasFeeEstimation = swapTxContext.gasFeeEstimation

      // Execute approval transaction if needed
      const approveTxHash = yield* executeApprovalStep({
        preSignedTransaction,
        factory,
        executor,
        gasFeeEstimation,
        shouldWait,
        swapTxId: txId,
        onFailure,
      })

      // Execute permit transaction if needed
      yield* executePermitStep({
        preSignedTransaction,
        factory,
        executor,
        shouldWait,
        onFailure,
      })

      // Execute the main swap transaction
      const transactedUSDValue = analytics.token_in_amount_usd ?? 0

      let swapResult: TransactionExecutionSyncResultSuccess | undefined

      if (isUniswapXPreSignedSwapTransaction(preSignedTransaction)) {
        // UniswapX routing - submit order
        const signedPermit = preSignedTransaction.signedSwapPermit
        const { quote } = preSignedTransaction.swapTxContext.trade.quote
        const routing = preSignedTransaction.swapTxContext.routing

        const uniswapXOrderData: UniswapXOrderTransactionData = {
          signedPermit,
          quote,
          routing,
          swapTxContext,
          transactedUSDValue,
          approveTxHash,
          txId,
          onSuccess,
          onFailure,
        }

        const uniswapXOrderParams = factory.createUniswapXOrderParams(uniswapXOrderData)
        yield* call(submitUniswapXOrder, uniswapXOrderParams)
      } else if (isWrap(swapTxContext)) {
        // Handle wrap transactions
        const wrapData: WrapTransactionData = {
          signedTx: preSignedTransaction.signedSwapTx,
          inputCurrencyAmount: swapTxContext.trade.inputAmount,
          txId,
          gasEstimate: swapTxContext.gasFeeEstimation.wrapEstimate,
        }

        const wrapParams = factory.createWrapParams(wrapData)
        const wrapStep: TransactionStep = {
          type: TransactionStepType.Wrap,
          params: wrapParams,
        }

        const isUnwrap = wrapParams.typeInfo.type === TransactionType.Wrap && wrapParams.typeInfo.unwrapped
        const wrapType = isUnwrap ? WrapType.Unwrap : WrapType.Wrap
        yield* put(
          pushNotification({
            type: AppNotificationType.SwapPending,
            wrapType,
          }),
        )

        swapResult = yield* executeTransactionStep({
          executor,
          step: wrapStep,
          chainId,
          logger: dependencies.logger,
          onFailure: params.onFailure,
        })
      } else {
        // Handle classic/bridge swap transactions
        const swapData: SwapTransactionData = {
          signedTx: preSignedTransaction.signedSwapTx,
          swapTxContext,
          transactedUSDValue,
          includesDelegation: swapTxContext.includesDelegation,
          isSmartWalletTransaction: preSignedTransaction.signedSwapTx.request.to === account.address,
          txId,
        }

        const swapParams = factory.createSwapParams(swapData)
        const swapStep: TransactionStep = {
          type: TransactionStepType.Swap,
          params: swapParams,
        }

        if (
          !getIsFlashblocksEnabled(chainId) ||
          FLASHBLOCKS_UI_SKIP_ROUTES.includes(preSignedTransaction.swapTxContext.routing)
        ) {
          yield* put(
            pushNotification({
              type: AppNotificationType.SwapPending,
              wrapType: WrapType.NotApplicable,
            }),
          )
        }

        swapResult = yield* executeTransactionStep({
          executor,
          step: swapStep,
          chainId,
          logger: dependencies.logger,
          onFailure: params.onFailure,
        })
      }

      if (swapResult) {
        if (isFinalizedTx(swapResult.transaction)) {
          // Update the store with tx receipt details
          const apolloClient = yield* call(apolloClientRef.onReady)
          yield* call(finalizeTransaction, {
            transaction: swapResult.transaction,
            apolloClient,
          })
        } else {
          // Update transaction with the new status, which will trigger a new transaction watcher
          yield* put(transactionActions.updateTransaction(swapResult.transaction))
        }
      }

      // Call onSuccess now if it wasn't called earlier due to transaction spacing
      if (swapTxHasDelayedSubmission) {
        yield* call(onSuccess)
      }
    } catch (error) {
      dependencies.logger.error(error, {
        tags: { file: 'executeSwapSaga', function: 'executeSwap' },
        extra: { analytics: params.analytics },
      })
    }
  }
}

function shouldUseSyncSwapSubmission(chainId: UniverseChainId): boolean {
  const defaultSyncChainIds: UniverseChainId[] = []
  const syncTransactionSubmissionChainIds = getDynamicConfigValue({
    config: DynamicConfigs.SyncTransactionSubmissionChainIds,
    key: SyncTransactionSubmissionChainIdsConfigKey.ChainIds,
    defaultValue: defaultSyncChainIds,
  })
  return syncTransactionSubmissionChainIds.includes(chainId)
}
