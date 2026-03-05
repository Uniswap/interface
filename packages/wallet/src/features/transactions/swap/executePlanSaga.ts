import { call, put, SagaGenerator } from 'typed-redux-saga'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { CAIP25Session } from 'uniswap/src/features/capabilities/caip25/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { HandleUniswapXPlanSignatureStepParams } from 'uniswap/src/features/transactions/steps/types'
import { plan } from 'uniswap/src/features/transactions/swap/plan/planSaga'
import { SwapExecutionCallbacks } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { prepareTransactionServices } from 'wallet/src/features/transactions/shared/baseTransactionPreparationSaga'
import { shouldSubmitViaPrivateRpc } from 'wallet/src/features/transactions/swap/prepareAndSignSwapSaga'
import {
  DelegationType,
  type TransactionSagaDependencies,
} from 'wallet/src/features/transactions/types/transactionSagaDependencies'

export type ExecutePlanParams = {
  txId?: string
  address: string
  analytics: SwapTradeBaseProperties
  swapTxContext: ValidatedSwapTxContext
  getOnPressRetry?: (error: Error | undefined) => (() => void) | undefined
  caip25Info: CAIP25Session | undefined
} & SwapExecutionCallbacks

/**
 * Factory function that creates an execute plan saga with injected dependencies
 */
export function createExecutePlanSaga(dependencies: TransactionSagaDependencies) {
  return function* executePlan(params: ExecutePlanParams) {
    const { onPending } = params
    yield* call(onPending)
    yield* executeChainedPlan(params, dependencies)
  }
}

/**
 * Internal function to execute a chained plan with the provided dependencies
 */
function* executeChainedPlan(params: ExecutePlanParams, dependencies: TransactionSagaDependencies) {
  const { address, swapTxContext } = params

  // Temporary -- changed to directly using account 1 PR upstack
  const account = { address, type: AccountType.SignerMnemonic } as const

  const delegationType = swapTxContext.includesDelegation ? DelegationType.Delegate : DelegationType.Auto

  /**
   * Reusable helper to prepare transaction services with common parameters
   */
  function* prepareServicesForChain(chainId: UniverseChainId, txRequest?: ValidatedTransactionRequest) {
    const submitViaPrivateRpc = !!txRequest && (yield* call(shouldSubmitViaPrivateRpc, chainId))

    return yield* prepareTransactionServices(dependencies, {
      account,
      chainId,
      submitViaPrivateRpc,
      delegationType,
      request: txRequest,
    })
  }

  yield* plan({
    ...params,
    address: account.address,
    selectChain: (_chainId: number) => Promise.resolve(true),
    *handleApprovalTransactionStep(handleApprovalStepParams): SagaGenerator<string> {
      const { payload, tokenInChainId, txRequest } = handleApprovalStepParams.step
      const { transactionSigner } = yield* prepareServicesForChain(
        tokenInChainId as unknown as UniverseChainId,
        txRequest,
      )
      const preparedTransaction = yield* call([transactionSigner, transactionSigner.prepareTransaction], {
        request: payload,
      })

      const signedTx = yield* call([transactionSigner, transactionSigner.signTransaction], preparedTransaction)
      const result = yield* call([transactionSigner, transactionSigner.sendTransaction], { signedTx })
      return result
    },
    *handleSwapTransactionStep(handleSwapStepParams): SagaGenerator<string> {
      const { payload, tokenInChainId, txRequest } = handleSwapStepParams.step
      const { transactionSigner } = yield* prepareServicesForChain(
        tokenInChainId as unknown as UniverseChainId,
        txRequest,
      )

      const preparedTransaction = yield* call([transactionSigner, transactionSigner.prepareTransaction], {
        request: payload,
      })
      const signedTx = yield* call([transactionSigner, transactionSigner.signTransaction], preparedTransaction)
      const hash = yield* call([transactionSigner, transactionSigner.sendTransaction], { signedTx })

      yield* call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, {
        transaction_hash: hash,
        ...handleSwapStepParams.analytics,
      })

      return hash
    },
    *handleSignatureStep(handleSignatureStepParams): SagaGenerator<string> {
      const { domain, types, values, tokenInChainId } = handleSignatureStepParams.step
      const { transactionSigner } = yield* prepareServicesForChain(tokenInChainId as unknown as UniverseChainId)
      const result = yield* call([transactionSigner, transactionSigner.signTypedData], {
        domain,
        types,
        value: values,
      })
      return result
    },
    *handleUniswapXPlanSignatureStep(
      handleUniswapXPlanSignatureStepParams: HandleUniswapXPlanSignatureStepParams,
    ): SagaGenerator<string> {
      const payload = handleUniswapXPlanSignatureStepParams.step
      const { transactionSigner } = yield* prepareServicesForChain(payload.domain.chainId as UniverseChainId)
      const result = yield* call([transactionSigner, transactionSigner.signTypedData], {
        domain: payload.domain,
        types: payload.types,
        value: payload.values,
      })
      return result
    },
    handleSwapTransactionBatchedStep() {
      throw new Error('5792-style batching does not apply to wallet applications.')
    },
    *sendToast(appNotification): SagaGenerator<void> {
      switch (appNotification.type) {
        case AppNotificationType.SwapPending: {
          yield* put(pushNotification(appNotification))
          break
        }
        default: {
          dependencies.logger.warn('executeSwapSaga', 'sendToast', 'Unknown app notification type', appNotification)
          break
        }
      }
    },
    getDisplayableError: ({ error }: { error: Error }) => {
      dependencies.logger.error(error, {
        tags: { file: 'executeSwapSaga', function: 'getDisplayableError' },
        extra: { error },
      })
      return new Error(error.message)
    },
  })
}
