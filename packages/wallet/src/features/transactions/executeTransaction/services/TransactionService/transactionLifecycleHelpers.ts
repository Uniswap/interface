import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import type {
  OnChainTransactionDetails,
  TransactionDetails,
  TransactionOptions,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionOriginType, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isBridgeTypeInfo, isSwapTypeInfo } from 'uniswap/src/features/transactions/types/utils'
import type { logger as loggerUtil } from 'utilities/src/logger/logger'
import type { AnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsService'
import type { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import { getRPCErrorCategory, getRPCErrorCode, getRPCProvider } from 'wallet/src/features/transactions/utils'

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
  logger: typeof loggerUtil
}): Promise<never> {
  const { error, unsubmittedTransaction, chainId, typeInfo, options, methodName, transactionRepository, logger } =
    params

  await transactionRepository.finalizeTransaction({
    transaction: unsubmittedTransaction,
    status: TransactionStatus.Failed,
  })

  if (error instanceof Error) {
    const errorCategory = getRPCErrorCategory(error)
    const rpcProvider = getRPCProvider(error)
    const rpcErrorCode = getRPCErrorCode(error)

    const logExtra = {
      category: errorCategory,
      rpcProvider,
      rpcErrorCode,
      chainId,
      transactionType: typeInfo.type,
      ...options,
    }

    // Log warning for alerting
    logger.warn('TransactionService', methodName, 'RPC Failure', {
      errorMessage: error.message,
      ...logExtra,
    })

    // Log error for full error details
    logger.error(error, {
      tags: { file: 'TransactionService', function: methodName },
      extra: logExtra,
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
