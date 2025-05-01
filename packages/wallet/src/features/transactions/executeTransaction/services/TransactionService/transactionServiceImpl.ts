import type { BaseProvider, Provider } from '@ethersproject/providers'
import { AccountType, type AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger as loggerUtil } from 'utilities/src/logger/logger'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import type { ExecuteTransactionParams } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import type { AnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsService'
import type { TransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigService'
import type { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import type { TransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import type {
  TransactionResponse,
  TransactionSigner,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import type { CalculatedNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import { createGetUpdatedTransactionDetails } from 'wallet/src/features/transactions/executeTransaction/utils/createGetUpdatedTransactionDetails'
import { createUnsubmittedTransactionDetails } from 'wallet/src/features/transactions/executeTransaction/utils/createUnsubmittedTransactionDetails'
import { getRPCErrorCategory } from 'wallet/src/features/transactions/utils'
/**
 * Implementation of the TransactionService interface using explicit dependencies.
 * Handles blockchain transaction operations with proper separation of concerns.
 */
export function createTransactionService(ctx: {
  transactionRepository: TransactionRepository
  transactionSigner: TransactionSigner
  analyticsService: AnalyticsService
  configService: TransactionConfigService
  logger: typeof loggerUtil
  getProvider: () => Promise<Provider>
}): TransactionService {
  const { transactionRepository, transactionSigner, analyticsService, logger } = ctx

  return {
    /**
     * Send a transaction to the blockchain
     */
    async executeTransaction(params: ExecuteTransactionParams): Promise<{ transactionResponse: TransactionResponse }> {
      const { chainId, account, options, typeInfo, analytics } = params
      let request = options.request

      logger.debug('TransactionService', 'sendTransaction', `Sending tx on ${getChainLabel(chainId)} to ${request.to}`)

      if (account.type === AccountType.Readonly) {
        throw new Error('Account must support signing')
      }

      // Register the tx in the store before it's submitted
      const unsubmittedTransaction = createUnsubmittedTransactionDetails(params)
      await transactionRepository.addTransaction({ transaction: unsubmittedTransaction })

      let calculatedNonce: CalculatedNonce | undefined

      try {
        // Only fetch nonce if it's not already set
        if (!request.nonce) {
          calculatedNonce = await this.getNextNonce({
            account,
            chainId,
            submitViaPrivateRpc: options.submitViaPrivateRpc,
          })
          if (calculatedNonce) {
            request = { ...request, nonce: calculatedNonce.nonce }
          }
        }

        const provider = await ctx.getProvider()

        // Sign and send the transaction
        const { transactionResponse, populatedRequest, timestampBeforeSend } =
          await transactionSigner.signAndSendTransaction({ request })

        logger.debug('TransactionService', 'sendTransaction', 'Tx submitted:', transactionResponse.hash)

        // Get the current block number
        const baseProvider = provider as BaseProvider

        const getUpdatedTransactionDetails = createGetUpdatedTransactionDetails({
          getBlockNumber: () => baseProvider._getInternalBlockNumber(1000),
          isPrivateRpc: provider.constructor.name === 'FlashbotsRpcProvider',
        })

        // Update the transaction with the hash and populated request
        const updatedTransaction = await getUpdatedTransactionDetails({
          transaction: unsubmittedTransaction,
          hash: transactionResponse.hash,
          timestampBeforeSend,
          populatedRequest,
        })

        await transactionRepository.updateTransaction({ transaction: updatedTransaction })

        // Track analytics for swaps and bridges
        if (typeInfo.type === TransactionType.Swap || typeInfo.type === TransactionType.Bridge) {
          if (analytics) {
            analyticsService.trackSwapSubmitted(updatedTransaction, analytics)
          } else if (params.transactionOriginType === TransactionOriginType.Internal) {
            logger.error(new Error('Missing `analytics` for swap when calling `sendTransaction`'), {
              tags: { file: 'TransactionService', function: 'sendTransaction' },
              extra: { transaction: updatedTransaction },
            })
          }
        }

        return { transactionResponse }
      } catch (error) {
        await transactionRepository.finalizeTransaction({
          transaction: unsubmittedTransaction,
          status: TransactionStatus.Failed,
        })

        if (error instanceof Error) {
          const errorCategory = getRPCErrorCategory(error)

          const logExtra = {
            category: errorCategory,
            chainId,
            transactionType: typeInfo.type,
            calculatedNonce,
            ...options,
          }

          // Log warning for alerting
          logger.warn('TransactionService', 'sendTransaction', 'RPC Failure', {
            errorMessage: error.message,
            ...logExtra,
          })

          // Log error for full error details
          logger.error(error, {
            tags: { file: 'TransactionService', function: 'sendTransaction' },
            extra: logExtra,
          })

          throw new Error(`Failed to send transaction: ${errorCategory}`, {
            cause: error,
          })
        }

        throw error
      }
    },

    /**
     * Calculate the next nonce for an account on a chain
     * todo: this probably should be in a different service (account, provider, etc?)
     */
    async getNextNonce(input: {
      account: AccountMeta
      chainId: UniverseChainId
      submitViaPrivateRpc?: boolean
    }): Promise<CalculatedNonce | undefined> {
      const { account, chainId, submitViaPrivateRpc } = input
      try {
        const provider = await ctx.getProvider()
        const usePrivate = ctx.configService.shouldUsePrivateRpc({ chainId, submitViaPrivateRpc })

        // Get the transaction count from the provider
        const nonce = await provider.getTransactionCount(account.address, 'pending')

        // If using Flashbots with auth, it will already account for pending private transactions
        // Otherwise, add the local pending private transactions
        if (!usePrivate && isPrivateRpcSupportedOnChain(chainId)) {
          const pendingPrivateTransactionCount = await transactionRepository.getPendingPrivateTransactionCount({
            address: account.address,
            chainId,
          })

          return {
            nonce: nonce + pendingPrivateTransactionCount,
            pendingPrivateTxCount: pendingPrivateTransactionCount,
          }
        }

        return { nonce }
      } catch (error) {
        logger.error(error, {
          tags: { file: 'TransactionService', function: 'getNextNonce' },
          extra: { account, chainId },
        })

        return undefined
      }
    },
  }
}
