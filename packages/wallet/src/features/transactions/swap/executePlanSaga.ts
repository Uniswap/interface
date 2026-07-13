import { BigNumber } from 'ethers'
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
import { PlanPriceChangeInterrupt } from 'uniswap/src/features/transactions/swap/plan/types'
import { SwapExecutionCallbacks } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { emitSubmissionErrorTelemetry } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionLifecycleHelpers'
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
    // SWAP-2471: always-on window marker for concurrency-overlap analysis (H4). Only address/txId are
    // in scope at the worker level (chainId is per-step; planId is minted inside plan()). Guarded so a
    // throwing emit can't replace an in-flight plan error via the catch-less finally below.
    // oxlint-disable-next-line typescript/explicit-function-return-type
    function* emitWindow(phase: 'start' | 'end') {
      try {
        yield* call(sendAnalyticsEvent, WalletEventName.SwapExecutionWindow, {
          saga: 'executePlan',
          phase,
          address: params.address,
          tx_id: params.txId,
          timestamp_ms: Date.now(),
        })
      } catch (telemetryError) {
        dependencies.logger.warn('executePlanSaga', 'executePlan', 'SwapExecutionWindow emit failed', {
          phase,
          error: telemetryError,
        })
      }
    }

    yield* emitWindow('start')
    try {
      yield* call(onPending)
      yield* executeChainedPlan(params, dependencies)
    } finally {
      yield* emitWindow('end')
    }
  }
}

/**
 * Internal function to execute a chained plan with the provided dependencies
 */
// oxlint-disable-next-line typescript/explicit-function-return-type
function* executeChainedPlan(params: ExecutePlanParams, dependencies: TransactionSagaDependencies) {
  const { address, swapTxContext } = params

  // Temporary -- changed to directly using account 1 PR upstack
  const account = { address, type: AccountType.SignerMnemonic } as const

  const delegationType = swapTxContext.includesDelegation ? DelegationType.Delegate : DelegationType.Auto

  /**
   * Reusable helper to prepare transaction services with common parameters
   */
  // oxlint-disable-next-line typescript/explicit-function-return-type
  function* prepareServicesForChain(chainId: UniverseChainId, txRequest?: ValidatedTransactionRequest) {
    const submitViaPrivateRpc = !!txRequest && (yield* call(shouldSubmitViaPrivateRpc, chainId))

    const services = yield* prepareTransactionServices(dependencies, {
      account,
      chainId,
      submitViaPrivateRpc,
      delegationType,
      request: txRequest,
    })
    // Expose submitViaPrivateRpc so the chained-plan submission-error telemetry can record it (SWAP-2471).
    return { ...services, submitViaPrivateRpc }
  }

  yield* plan({
    ...params,
    address: account.address,
    selectChain: (_chainId: number) => Promise.resolve(true),
    *handleApprovalTransactionStep(handleApprovalStepParams): SagaGenerator<string> {
      const { payload, tokenInChainId, txRequest } = handleApprovalStepParams.step
      const chainId = tokenInChainId as unknown as UniverseChainId
      const { transactionSigner, calculatedNonce, submitViaPrivateRpc } = yield* prepareServicesForChain(
        chainId,
        txRequest,
      )
      const preparedTransaction = yield* call([transactionSigner, transactionSigner.prepareTransaction], {
        request: payload,
      })
      const preparedNonce =
        preparedTransaction.nonce !== undefined ? BigNumber.from(preparedTransaction.nonce).toNumber() : undefined

      // SWAP-2471: per-step nonce keyed by {planId, stepIndex}. Plan steps recompute the nonce fresh
      // with NO inter-step increment, so two concurrent plans can collide on the same nonce.
      dependencies.logger.info('executePlanSaga', 'handleApprovalTransactionStep', 'Plan step nonce', {
        planId: handleApprovalStepParams.planId,
        stepIndex: handleApprovalStepParams.step.stepIndex,
        stepType: handleApprovalStepParams.step.type,
        chainId,
        address: account.address,
        baseNonce: calculatedNonce?.nonce,
        preparedNonce,
        timestampMs: Date.now(),
      })

      const signedTx = yield* call([transactionSigner, transactionSigner.signTransaction], preparedTransaction)
      try {
        return yield* call([transactionSigner, transactionSigner.sendTransaction], { signedTx })
      } catch (error) {
        // Chained-plan steps submit directly via the signer, bypassing TransactionService's
        // handleTransactionError — so emit the same submission-failure telemetry here (SWAP-2471).
        emitSubmissionErrorTelemetry({
          error,
          chainId,
          transactionType: 'plan_approve',
          methodName: 'handleApprovalTransactionStep',
          logger: dependencies.logger,
          emitEvent: (properties) => sendAnalyticsEvent(WalletEventName.OnchainTransactionSubmissionError, properties),
          assignedNonce: preparedNonce,
          // submit_via_private_rpc + includes_delegation are in scope here; the other options-sourced fields
          // (private_rpc_provider, is_smart_wallet_transaction, pending_private_tx_count_at_failure) have no
          // chained-path source and are left undefined to match the main error path (SWAP-2471).
          options: { submitViaPrivateRpc, includesDelegation: swapTxContext.includesDelegation },
        })
        throw error
      }
    },
    *handleSwapTransactionStep(handleSwapStepParams): SagaGenerator<string> {
      const { payload, tokenInChainId, txRequest } = handleSwapStepParams.step
      const chainId = tokenInChainId as unknown as UniverseChainId
      const { transactionSigner, calculatedNonce, submitViaPrivateRpc } = yield* prepareServicesForChain(
        chainId,
        txRequest,
      )

      const preparedTransaction = yield* call([transactionSigner, transactionSigner.prepareTransaction], {
        request: payload,
      })
      const preparedNonce =
        preparedTransaction.nonce !== undefined ? BigNumber.from(preparedTransaction.nonce).toNumber() : undefined

      dependencies.logger.info('executePlanSaga', 'handleSwapTransactionStep', 'Plan step nonce', {
        planId: handleSwapStepParams.planId,
        stepIndex: handleSwapStepParams.step.stepIndex,
        stepType: handleSwapStepParams.step.type,
        chainId,
        address: account.address,
        baseNonce: calculatedNonce?.nonce,
        preparedNonce,
        timestampMs: Date.now(),
      })

      const signedTx = yield* call([transactionSigner, transactionSigner.signTransaction], preparedTransaction)
      let hash: string
      try {
        hash = yield* call([transactionSigner, transactionSigner.sendTransaction], { signedTx })
      } catch (error) {
        emitSubmissionErrorTelemetry({
          error,
          chainId,
          transactionType: 'plan_swap',
          methodName: 'handleSwapTransactionStep',
          logger: dependencies.logger,
          emitEvent: (properties) => sendAnalyticsEvent(WalletEventName.OnchainTransactionSubmissionError, properties),
          assignedNonce: preparedNonce,
          // See handleApprovalTransactionStep: only the in-scope private-RPC + delegation flags are recorded
          // on the chained path; the remaining options-sourced fields stay undefined (SWAP-2471).
          options: { submitViaPrivateRpc, includesDelegation: swapTxContext.includesDelegation },
        })
        throw error
      }

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
    handleSwapTransactionWalletCallStep() {
      throw new Error('5792-style batching does not apply to wallet applications.')
    },
    *sendToast(appNotification): SagaGenerator<void> {
      switch (appNotification.type) {
        case AppNotificationType.SwapPending:
        case AppNotificationType.Transaction: {
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
      // UI gracefully handles price changes, so we don't need to display an error
      if (error instanceof PlanPriceChangeInterrupt) {
        return undefined
      }

      dependencies.logger.error(error, { tags: { file: 'executeSwapSaga', function: 'getDisplayableError' } })

      return new Error(error.message)
    },
  })
}
