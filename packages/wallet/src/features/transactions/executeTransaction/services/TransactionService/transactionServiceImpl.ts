import type { BaseProvider, Provider } from '@ethersproject/providers'
import { utils } from 'ethers'
import { type AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { FlashbotsRpcProvider } from 'uniswap/src/features/providers/FlashbotsRpcProvider'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import type {
  OnChainTransactionDetails,
  TransactionDetails,
  TransactionOptions,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionOriginType, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isBridgeTypeInfo, isSwapTypeInfo } from 'uniswap/src/features/transactions/types/utils'
import { logger as loggerUtil } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import type { ExecuteTransactionParams } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import type { AnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsService'
import type { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import type {
  PrepareTransactionParams,
  SubmitTransactionParams,
  SubmitTransactionParamsWithTypeInfo,
  TransactionService,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import type { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import type { TransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigService'
import type { CalculatedNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { createGetUpdatedTransactionDetails } from 'wallet/src/features/transactions/executeTransaction/utils/createGetUpdatedTransactionDetails'
import { createUnsubmittedTransactionDetails } from 'wallet/src/features/transactions/executeTransaction/utils/createUnsubmittedTransactionDetails'
import { getRPCErrorCategory, processTransactionReceipt } from 'wallet/src/features/transactions/utils'

/**
 * Handles transaction failure by finalizing the transaction as failed and logging the error
 */
async function handleTransactionError(params: {
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

    const logExtra = {
      category: errorCategory,
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
 * Handles analytics tracking for swap and bridge transactions
 */
function trackTransactionAnalytics(params: {
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

/**
 * Result of transaction submission containing the information needed to update the transaction
 */
interface TransactionSubmissionResult {
  /** The updated transaction details */
  updatedTransaction: OnChainTransactionDetails & { hash: string }
  /** Whether to skip processing when updating the transaction in the repository */
  skipProcessing: boolean
}

/**
 * Function type for submitting a transaction with different methods
 */
type TransactionSubmissionFunction = (params: {
  request: SignedTransactionRequest
  provider: Provider
  unsubmittedTransaction: OnChainTransactionDetails
  timestampBeforeSign: number
  timestampBeforeSend: number
}) => Promise<TransactionSubmissionResult>

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
  const { transactionRepository, analyticsService, logger } = ctx

  function isPrivateRpc(provider: Provider): provider is FlashbotsRpcProvider {
    return provider instanceof FlashbotsRpcProvider
  }

  /**
   * Calculate the next nonce for an account on a chain
   * @param input - Configuration object for nonce calculation
   * @param input.account - The account metadata to get nonce for
   * @param input.chainId - The blockchain chain identifier
   * @param input.submitViaPrivateRpc - Whether to use private RPC submission
   * @returns Promise resolving to the calculated nonce information
   * @throws {Error} When the nonce cannot be calculated due to network or validation issues
   */
  async function getNextNonce(input: {
    account: AccountMeta
    chainId: UniverseChainId
    submitViaPrivateRpc?: boolean
  }): Promise<CalculatedNonce> {
    const { account, chainId, submitViaPrivateRpc } = input
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
  }

  /**
   * Factory function to create a transaction submission function with pre-configured context
   */
  function createSubmitTransaction(config: { submissionFunction: TransactionSubmissionFunction; methodName: string }) {
    return async function submit(
      submitParams: SubmitTransactionParamsWithTypeInfo,
    ): Promise<TransactionDetails & { hash: string }> {
      const { submissionFunction, methodName } = config
      const { chainId, request, options, typeInfo, analytics } = submitParams

      logger.debug('TransactionService', methodName, `Sending tx on ${getChainLabel(chainId)} to ${request.request.to}`)

      // Register the tx in the store before it's submitted, so it exists in case of an error
      const unsubmittedTransaction = createUnsubmittedTransactionDetails(submitParams)
      await transactionRepository.addTransaction({ transaction: unsubmittedTransaction })

      try {
        const provider = await ctx.getProvider()
        const timestampBeforeSend = Date.now()

        // Use the provided submission function to handle the core submission logic
        const submissionResult = await submissionFunction({
          request,
          provider,
          unsubmittedTransaction,
          timestampBeforeSign: request.timestampBeforeSign,
          timestampBeforeSend,
        })

        const { updatedTransaction, skipProcessing } = submissionResult

        await transactionRepository.updateTransaction({
          transaction: updatedTransaction,
          skipProcessing,
        })

        logger.debug('TransactionService', methodName, 'Transaction updated in repository')

        // Track analytics for swaps and bridges
        trackTransactionAnalytics({
          analytics,
          transactionOriginType: submitParams.transactionOriginType,
          updatedTransaction,
          methodName,
          analyticsService,
          logger,
        })

        return updatedTransaction
      } catch (error) {
        await handleTransactionError({
          error,
          unsubmittedTransaction,
          chainId,
          typeInfo,
          options,
          methodName,
          transactionRepository,
          logger,
        })
        // This line is unreachable since handleTransactionError always throws
        // but TypeScript requires it for type safety
        throw error
      }
    }
  }

  /**
   * Prepare and sign a transaction
   */
  async function prepareAndSignTransaction(params: PrepareTransactionParams): Promise<SignedTransactionRequest> {
    const { chainId, account, request, submitViaPrivateRpc } = params

    let nonce = request.nonce
    if (!nonce) {
      try {
        const calculatedNonce = await getNextNonce({
          account,
          chainId,
          submitViaPrivateRpc,
        })
        nonce = calculatedNonce.nonce
      } catch (error) {
        // If the nonce cannot be calculated, we proceed with the flow because while populating
        // the transaction request, the nonce is calculated and set by the provider (without our custom logic).
        logger.error(error, {
          tags: { file: 'TransactionService', function: 'getNextNonce' },
          extra: { account, chainId },
        })
      }
    }

    const preparedTransaction = await ctx.transactionSigner.prepareTransaction({ request: { ...request, nonce } })
    const validatedTransaction = validateTransactionRequest(preparedTransaction)

    if (!validatedTransaction) {
      throw new Error('Invalid transaction request')
    }

    const timestampBeforeSign = Date.now()
    const signedTransaction = await ctx.transactionSigner.signTransaction(validatedTransaction)

    return { request: validatedTransaction, signedRequest: signedTransaction, timestampBeforeSign }
  }

  /**
   * Send a transaction to the blockchain
   */
  async function submitTransaction(params: SubmitTransactionParams): Promise<{ transactionHash: string }> {
    const submissionFunction = async (submitParams: {
      request: SignedTransactionRequest
      provider: Provider
      unsubmittedTransaction: OnChainTransactionDetails
      timestampBeforeSign: number
      timestampBeforeSend: number
    }): Promise<TransactionSubmissionResult> => {
      const { request, provider, unsubmittedTransaction, timestampBeforeSign, timestampBeforeSend } = submitParams

      // Sign and send the transaction
      const transactionHash = await ctx.transactionSigner.sendTransaction({ signedTx: request.signedRequest })

      logger.debug('TransactionService', 'sendTransaction', 'Tx submitted:', transactionHash)

      // Get the current block number
      const baseProvider = provider as BaseProvider

      const getUpdatedTransactionDetails = createGetUpdatedTransactionDetails({
        // Fetches the blockNumber, but will reuse any result that is less than 1000ms old
        getBlockNumber: () => baseProvider._getInternalBlockNumber(ONE_SECOND_MS),
        isPrivateRpc: isPrivateRpc(provider),
      })

      // Update the transaction with the hash and populated request
      const updatedTransaction = await getUpdatedTransactionDetails({
        transaction: unsubmittedTransaction,
        hash: transactionHash,
        timestampBeforeSign,
        timestampBeforeSend,
        populatedRequest: request.request,
      })

      return {
        updatedTransaction,
        skipProcessing: false,
      }
    }

    // Calculate the transaction hash directly from the signed request
    const transactionHash = utils.keccak256(params.request.signedRequest)

    // Submit the transaction in the background
    const submitPromise = params.typeInfo
      ? // Submit and update the local state
        createSubmitTransaction({
          submissionFunction,
          methodName: 'sendTransaction',
        })({ ...params, typeInfo: params.typeInfo })
      : // Submit the transaction directly without updating the local state
        ctx.transactionSigner.sendTransaction({ signedTx: params.request.signedRequest })

    submitPromise.catch((error) => {
      logger.error(error, {
        tags: { file: 'TransactionService', function: 'submitTransaction' },
        extra: { context: 'Background submission failed' },
      })
    })

    // Return the hash immediately
    return { transactionHash }
  }

  /**
   * Submit a transaction synchronously and return the transaction with receipt details
   */
  async function submitTransactionSync(params: SubmitTransactionParamsWithTypeInfo): Promise<TransactionDetails> {
    const submissionFunction = async (submitParams: {
      request: SignedTransactionRequest
      provider: Provider
      unsubmittedTransaction: OnChainTransactionDetails
      timestampBeforeSign: number
      timestampBeforeSend: number
    }): Promise<TransactionSubmissionResult> => {
      const { request, provider, unsubmittedTransaction, timestampBeforeSign, timestampBeforeSend } = submitParams

      logger.debug('TransactionService', 'submitTransactionSync', 'Calling sendTransactionSync...')

      // Send the transaction using the sync method via the transaction signer service
      const ethersReceipt = await ctx.transactionSigner.sendTransactionSync({ signedTx: request.signedRequest })

      logger.debug('TransactionService', 'submitTransactionSync', 'Sync tx completed with receipt:', {
        transactionHash: ethersReceipt.transactionHash,
        blockNumber: ethersReceipt.blockNumber,
        gasUsed: ethersReceipt.gasUsed.toString(),
        status: ethersReceipt.status,
      })

      // Get the current block number
      const baseProvider = provider as BaseProvider

      const getUpdatedTransactionDetails = createGetUpdatedTransactionDetails({
        // Fetches the blockNumber, but will reuse any result that is less than 1000ms old
        getBlockNumber: () => baseProvider._getInternalBlockNumber(ONE_SECOND_MS),
        isPrivateRpc: isPrivateRpc(provider),
      })

      // Update the transaction with the hash and populated request
      let updatedTransaction = await getUpdatedTransactionDetails({
        transaction: unsubmittedTransaction,
        hash: ethersReceipt.transactionHash,
        timestampBeforeSign,
        timestampBeforeSend,
        populatedRequest: request.request,
      })

      // Process the transaction receipt to get the final transaction details
      updatedTransaction = processTransactionReceipt({
        ethersReceipt,
        transaction: updatedTransaction,
      })

      return {
        updatedTransaction,
        skipProcessing: true,
      }
    }

    const submit = createSubmitTransaction({
      submissionFunction,
      methodName: 'submitTransactionSync',
    })

    return await submit(params)
  }

  /**
   * Execute a transaction by preparing, signing, and submitting it
   * If a pre-signed transaction is provided, it will skip the preparation and signing steps
   */
  async function executeTransaction(params: ExecuteTransactionParams): Promise<{ transactionHash: string }> {
    const { chainId, account, options, typeInfo, preSignedTransaction } = params

    logger.debug(
      'TransactionService',
      'executeTransaction',
      `Executing tx on ${getChainLabel(chainId)} to ${options.request.to}`,
    )

    try {
      const signedTransactionRequest =
        preSignedTransaction ??
        (await prepareAndSignTransaction({
          chainId,
          account,
          request: options.request,
          submitViaPrivateRpc: options.submitViaPrivateRpc ?? false,
        }))

      // Submit the signed transaction
      const result = await submitTransaction({
        ...params,
        request: signedTransactionRequest,
      })

      return result
    } catch (error) {
      logger.error(error, {
        tags: { file: 'TransactionService', function: 'executeTransaction' },
        extra: { chainId, transactionType: typeInfo?.type, ...options },
      })

      throw error
    }
  }

  return {
    prepareAndSignTransaction,
    submitTransaction,
    submitTransactionSync,
    executeTransaction,
    getNextNonce,
  }
}
