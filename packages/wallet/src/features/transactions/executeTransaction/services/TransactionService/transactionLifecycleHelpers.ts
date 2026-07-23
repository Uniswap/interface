import { BigNumber } from 'ethers'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import type { SwapTradeBaseProperties, UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import type {
  OnChainTransactionDetails,
  TransactionDetails,
  TransactionOptions,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionOriginType, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isBridgeTypeInfo, isSwapTypeInfo } from 'uniswap/src/features/transactions/types/utils'
import { DatadogLogMetrics, logAsMetric } from 'utilities/src/logger/datadog/datadogLogMetrics'
import type { logger as loggerUtil } from 'utilities/src/logger/logger'
import type { AnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsService'
import type { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import { getRPCErrorCategory, getRPCErrorCode, getRPCProvider } from 'wallet/src/features/transactions/utils'

/**
 * Emits SWAP-2471 submission-failure telemetry: the refined error category to Datadog logs + a
 * rate-based metric, plus the unsampled `OnchainTransactionSubmissionError` analytics event.
 * Side effects are limited to logging/analytics — the caller finalizes/throws. Shared by the
 * TransactionService submit path and the chained-plan step path (which bypasses
 * `TransactionService.submitTransaction`). Returns the refined category (undefined for a non-Error).
 */
export function emitSubmissionErrorTelemetry(params: {
  error: unknown
  chainId: UniverseChainId
  transactionType: string
  methodName: string
  logger: typeof loggerUtil
  emitEvent: (properties: UniverseEventProperties[WalletEventName.OnchainTransactionSubmissionError]) => void
  options?: TransactionOptions
  transactionId?: string
  transactionHash?: string
  assignedNonce?: number
  pendingPrivateTxCountAtFailure?: number
}): string | undefined {
  const {
    error,
    chainId,
    transactionType,
    methodName,
    logger,
    emitEvent,
    options,
    transactionId,
    transactionHash,
    assignedNonce,
    pendingPrivateTxCountAtFailure,
  } = params

  if (!(error instanceof Error)) {
    return undefined
  }

  const errorCategory = getRPCErrorCategory(error)
  const rpcProvider = getRPCProvider(error)
  const rpcErrorCode = getRPCErrorCode(error)

  const logExtra = {
    category: errorCategory,
    rpcProvider,
    rpcErrorCode,
    chainId,
    transactionType,
    transactionId,
    transactionHash,
    assignedNonce,
    pendingPrivateTxCountAtFailure,
    ...options,
  }

  // Log warning for alerting + error for full details (existing behavior, now enriched).
  logger.warn('TransactionService', methodName, 'RPC Failure', { errorMessage: error.message, ...logExtra })
  logger.error(error, { tags: { file: 'TransactionService', function: methodName }, extra: logExtra })

  // Rate-based alerting (emitted as a Datadog LOG whose message is the metric name — a log monitor).
  logAsMetric({
    fileName: 'TransactionService',
    functionName: methodName,
    metric: DatadogLogMetrics.TransactionSubmissionError,
    data: {
      chainId,
      errorCategory,
      submitViaPrivateRpc: options?.submitViaPrivateRpc,
      includesDelegation: options?.includesDelegation,
    },
    level: 'warn',
  })

  // Full-coverage forensic event (Amplitude is not session-sampled).
  emitEvent({
    transaction_id: transactionId,
    transaction_hash: transactionHash,
    chain_id: chainId,
    nonce: assignedNonce,
    error_category: errorCategory,
    rpc_error_code: rpcErrorCode,
    rpc_provider: rpcProvider,
    pending_private_tx_count_at_failure: pendingPrivateTxCountAtFailure,
    submit_via_private_rpc: options?.submitViaPrivateRpc,
    private_rpc_provider: options?.privateRpcProvider,
    includes_delegation: options?.includesDelegation,
    is_smart_wallet_transaction: options?.isSmartWalletTransaction,
    transaction_type: transactionType,
  })

  return errorCategory
}

/**
 * Handles transaction failure by finalizing the transaction as failed and logging the error.
 */
export async function handleTransactionError(params: {
  error: unknown
  unsubmittedTransaction: OnChainTransactionDetails
  chainId: UniverseChainId
  typeInfo: TransactionTypeInfo
  options: TransactionOptions
  methodName: string
  transactionRepository: TransactionRepository
  analyticsService: AnalyticsService
  logger: typeof loggerUtil
}): Promise<never> {
  const {
    error,
    unsubmittedTransaction,
    chainId,
    typeInfo,
    options,
    methodName,
    transactionRepository,
    analyticsService,
    logger,
  } = params

  await transactionRepository.finalizeTransaction({
    transaction: unsubmittedTransaction,
    status: TransactionStatus.Failed,
  })

  if (error instanceof Error) {
    const assignedNonce =
      options.request?.nonce !== undefined ? BigNumber.from(options.request.nonce).toNumber() : undefined

    // The CURRENT local pending-private count at failure time = the inflation reservoir size (SWAP-2471).
    let pendingPrivateTxCountAtFailure: number | undefined
    try {
      pendingPrivateTxCountAtFailure = await transactionRepository.getPendingPrivateTransactionCount({
        address: unsubmittedTransaction.from,
        chainId,
      })
    } catch {
      pendingPrivateTxCountAtFailure = undefined
    }

    const errorCategory = emitSubmissionErrorTelemetry({
      error,
      chainId,
      transactionType: String(typeInfo.type),
      methodName,
      logger,
      emitEvent: (properties) =>
        analyticsService.trackTransactionEvent(WalletEventName.OnchainTransactionSubmissionError, properties),
      options,
      transactionId: unsubmittedTransaction.id,
      transactionHash: unsubmittedTransaction.hash,
      assignedNonce,
      pendingPrivateTxCountAtFailure,
    })

    throw new Error(`Failed to send transaction: ${errorCategory}`, {
      cause: error,
    })
  }

  throw error
}

/**
 * Handles analytics tracking for swap and bridge transactions.
 */
export function trackTransactionAnalytics(params: {
  analytics?: SwapTradeBaseProperties
  transactionOriginType: TransactionOriginType
  updatedTransaction: TransactionDetails
  methodName: string
  analyticsService: AnalyticsService
  logger: typeof loggerUtil
}): void {
  const { analytics, transactionOriginType, updatedTransaction, methodName, analyticsService, logger } = params

  // Track analytics for swaps and bridges
  if (isBridgeTypeInfo(updatedTransaction.typeInfo) || isSwapTypeInfo(updatedTransaction.typeInfo)) {
    if (analytics) {
      analyticsService.trackSwapSubmitted(updatedTransaction, analytics)
    } else if (transactionOriginType === TransactionOriginType.Internal) {
      logger.error(new Error(`Missing \`analytics\` for swap when calling \`${methodName}\``), {
        tags: { file: 'TransactionService', function: methodName },
        extra: { transaction: updatedTransaction },
      })
    }
  }
}
