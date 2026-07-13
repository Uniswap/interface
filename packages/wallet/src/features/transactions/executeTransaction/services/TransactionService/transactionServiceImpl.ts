/* oxlint-disable max-lines */
import type { BaseProvider, Provider } from '@ethersproject/providers'
import { utils } from 'ethers'
import { type AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { FlashbotsRpcProvider } from 'uniswap/src/features/providers/FlashbotsRpcProvider'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { GasSponsorshipNotAppliedError } from 'uniswap/src/features/transactions/swap/errors'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import {
  TransactionStatus,
  type OnChainTransactionDetails,
  type TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger as loggerUtil } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { entryPoint08Address } from 'viem/account-abstraction'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { type ExecuteTransactionParams } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import type { AnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsService'
import type { TransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigService'
import type { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import {
  handleTransactionError,
  trackTransactionAnalytics,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionLifecycleHelpers'
import type {
  ExecuteUserOpParams,
  PrepareTransactionParams,
  SubmitTransactionParams,
  SubmitTransactionParamsWithTypeInfo,
  TransactionService,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import type { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import type { UserOpSigner } from 'wallet/src/features/transactions/executeTransaction/services/UserOpSignerService/userOpSignerService'
import type { CalculatedNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { createGetUpdatedTransactionDetails } from 'wallet/src/features/transactions/executeTransaction/utils/createGetUpdatedTransactionDetails'
import { createUnsubmittedTransactionDetails } from 'wallet/src/features/transactions/executeTransaction/utils/createUnsubmittedTransactionDetails'
import { buildNonceCalculatedProperties } from 'wallet/src/features/transactions/telemetry/nonceTelemetry'
import { getRPCErrorCategory, processTransactionReceipt } from 'wallet/src/features/transactions/utils'

/**
 * Result of transaction submission containing the information needed to update the transaction
 */
interface TransactionSubmissionResult {
  updatedTransaction: OnChainTransactionDetails
  skipProcessing: boolean
}

type TransactionSubmissionFunction<P extends SubmitTransactionParamsWithTypeInfo> = (params: {
  submitParams: P
  unsubmittedTransaction: OnChainTransactionDetails
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
  // Required only for the 4337 userOp path (`executeUserOp`). EOA-only flows can omit it.
  userOpSigner?: UserOpSigner
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
    const onChainPendingNonce = await provider.getTransactionCount(account.address, 'pending')
    const privateRpcSupported = isPrivateRpcSupportedOnChain(chainId)

    // If using Flashbots with auth, it already accounts for pending private transactions.
    // Otherwise (non-private on a private-supported chain), add the local pending private count.
    const shouldAddLocalPendingPrivateCount = !usePrivate && privateRpcSupported
    const pendingPrivateTxCount = shouldAddLocalPendingPrivateCount
      ? await transactionRepository.getPendingPrivateTransactionCount({ address: account.address, chainId })
      : 0
    // SWAP-2471: when the local count inflated the nonce, capture WHICH txs did it so the inflation
    // reservoir can later be linked to a gapped-nonce rejection at a higher nonce.
    const inflatingTxs =
      pendingPrivateTxCount > 0
        ? await transactionRepository.getPendingPrivateTransactionDetails({ address: account.address, chainId })
        : []

    const nonceProperties = buildNonceCalculatedProperties({
      chainId,
      address: account.address,
      submitViaPrivateRpc: Boolean(submitViaPrivateRpc),
      onChainPendingNonce,
      pendingPrivateTxCount,
      privateRpcSupported,
      inflatingTxs,
      nowMs: Date.now(),
    })
    // Datadog (session-sampled) on every decision for the distribution; Amplitude (unsampled) only
    // for inflation cases, to bound event volume.
    logger.info('TransactionService', 'getNextNonce', WalletEventName.NonceCalculated, nonceProperties)
    if (pendingPrivateTxCount > 0) {
      analyticsService.trackTransactionEvent(WalletEventName.NonceCalculated, nonceProperties)
    }

    // Preserve the original return shape exactly: pendingPrivateTxCount is omitted when unused.
    return shouldAddLocalPendingPrivateCount
      ? { nonce: onChainPendingNonce + pendingPrivateTxCount, pendingPrivateTxCount }
      : { nonce: onChainPendingNonce }
  }

  /**
   * Factory function to create a transaction submission function with pre-configured context.
   */
  function createSubmitTransaction<P extends SubmitTransactionParamsWithTypeInfo>(config: {
    submissionFunction: TransactionSubmissionFunction<P>
    methodName: string
  }) {
    return async function submit(submitParams: P): Promise<OnChainTransactionDetails> {
      const { submissionFunction, methodName } = config
      const { chainId, options, typeInfo, analytics } = submitParams

      logger.debug('TransactionService', methodName, `Submitting tx on ${getChainLabel(chainId)}`)

      // Register the tx in the store before it's submitted, so it exists in case of an error
      const unsubmittedTransaction = createUnsubmittedTransactionDetails(submitParams)
      await transactionRepository.addTransaction({ transaction: unsubmittedTransaction })

      try {
        const timestampBeforeSend = Date.now()

        // Use the provided submission function to handle the core submission logic
        const submissionResult = await submissionFunction({
          submitParams,
          unsubmittedTransaction,
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
          analyticsService,
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
    const submissionFunction: TransactionSubmissionFunction<SubmitTransactionParamsWithTypeInfo> = async ({
      submitParams,
      unsubmittedTransaction,
      timestampBeforeSend,
    }): Promise<TransactionSubmissionResult> => {
      if (!submitParams.request) {
        throw new Error('Missing tx request')
      }
      const { request } = submitParams
      const timestampBeforeSign = request.timestampBeforeSign
      const provider = await ctx.getProvider()

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

    if (!params.request) {
      throw new Error('Missing tx request')
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
    const submissionFunction: TransactionSubmissionFunction<SubmitTransactionParamsWithTypeInfo> = async ({
      submitParams,
      unsubmittedTransaction,
      timestampBeforeSend,
    }): Promise<TransactionSubmissionResult> => {
      const { request } = submitParams
      if (!request) {
        throw new Error('Missing tx request')
      }
      const timestampBeforeSign = request.timestampBeforeSign
      const provider = await ctx.getProvider()

      const baseProvider = provider as BaseProvider
      const getUpdatedTransactionDetails = createGetUpdatedTransactionDetails({
        // Fetches the blockNumber, but will reuse any result that is less than 1000ms old
        getBlockNumber: () => baseProvider._getInternalBlockNumber(ONE_SECOND_MS),
        isPrivateRpc: isPrivateRpc(provider),
      })

      logger.debug('TransactionService', 'submitTransactionSync', 'Calling sendTransactionSync...')

      try {
        // Send the transaction using the sync method via the transaction signer service
        const ethersReceipt = await ctx.transactionSigner.sendTransactionSync({ signedTx: request.signedRequest })

        logger.debug('TransactionService', 'submitTransactionSync', 'Sync tx completed with receipt:', {
          transactionHash: ethersReceipt.transactionHash,
          blockNumber: ethersReceipt.blockNumber,
          gasUsed: ethersReceipt.gasUsed.toString(),
          status: ethersReceipt.status,
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
      } catch (error) {
        // eth_sendRawTransactionSync can land the tx on-chain yet still surface a "nonce too low" /
        // "already known" error when an internal retry re-sends the raw tx and the node rejects the
        // duplicate. The deterministic hash being known on-chain is the source of truth: recover as
        // Pending and let the watcher resolve the real status. Otherwise our tx isn't on-chain (a
        // different tx took the nonce, or it never landed) — rethrow to finalize Failed.
        const hash = utils.keccak256(request.signedRequest)
        const knownOnChainTx = await baseProvider.getTransaction(hash).catch(() => null)
        if (!knownOnChainTx) {
          throw error
        }

        logger.warn(
          'TransactionService',
          'submitTransactionSync',
          'Sync submit errored but tx is known on-chain; treating as pending and deferring to watcher',
          {
            category: error instanceof Error ? getRPCErrorCategory(error) : 'unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        )

        const submittedTransaction = await getUpdatedTransactionDetails({
          transaction: unsubmittedTransaction,
          hash,
          timestampBeforeSign,
          timestampBeforeSend,
          populatedRequest: request.request,
        })

        return {
          updatedTransaction: submittedTransaction,
          skipProcessing: false,
        }
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

  /**
   * Execute a 4337 UserOperation by optionally sponsoring it, signing it, and submitting it to the bundler.
   */
  async function executeUserOp(params: ExecuteUserOpParams): Promise<{ userOpHash: string }> {
    function createUserOpSubmissionFunction(
      userOpSigner: UserOpSigner,
    ): TransactionSubmissionFunction<SubmitTransactionParamsWithTypeInfo> {
      return async ({ submitParams, unsubmittedTransaction }) => {
        if (!submitParams.userOp) {
          throw new Error('executeUserOp was not called with a user op')
        }
        const { userOp, chainId, requestUniswapGasSponsorship, paymasterServiceContext } = submitParams

        // Step 1: If we need to request Uniswap gas sponsorship, fill paymaster fields here.
        // Sponsorship is required when requested: if the paymaster call fails, the error propagates
        // and the whole transaction fails rather than silently signing an unsponsored userOp.
        let userOpReadyToSign = userOp
        if (requestUniswapGasSponsorship && !userOp.paymaster) {
          userOpReadyToSign = await userOpSigner.sponsorUniswapUserOp({
            initialUserOp: userOp,
            entryPoint: entryPoint08Address,
            paymasterServiceContext,
            chainId,
          })

          if (!userOpReadyToSign.paymaster) {
            throw new GasSponsorshipNotAppliedError('sponsored userOp returned without paymaster fields')
          }
        }

        // Step 2: Sign (EIP-712 + Calibur encoding). The 7702 auth is bundled into the 4337
        // request and round-trips on the userOp, so the Step 1 paymaster call already ran against
        // a delegated account; signUserOp throws if a delegation-needing userOp arrives without one
        // (it's never attached post-paymaster).
        const timestampBeforeSign = Date.now()
        const signedUserOp = await userOpSigner.signUserOp(userOpReadyToSign)

        // Step 3: Submit to bundler via UniRPC
        // Bundler handoff is the userOp analog of RPC submission; the sponsorship stage above is excluded.
        const timestampBeforeSend = Date.now()
        const userOpHash = await userOpSigner.sendUserOp(signedUserOp)
        const rpcSubmissionTimestampMs = Date.now()

        const updatedTransaction: OnChainTransactionDetails = {
          ...unsubmittedTransaction,
          userOpHash,
          status: TransactionStatus.Pending,
          options: {
            ...unsubmittedTransaction.options,
            rpcSubmissionTimestampMs,
            rpcSubmissionDelayMs: rpcSubmissionTimestampMs - timestampBeforeSend,
            signTransactionDelayMs: timestampBeforeSend - timestampBeforeSign,
          },
        }

        return { updatedTransaction, skipProcessing: false }
      }
    }

    const { userOpSigner } = ctx
    if (!userOpSigner) {
      throw new Error('executeUserOp requires a userOpSigner — create the service with `includeUserOpServices`')
    }

    const submit = createSubmitTransaction({
      submissionFunction: createUserOpSubmissionFunction(userOpSigner),
      methodName: 'executeUserOp',
    })
    const updatedTransaction = await submit(params)

    const userOpHash = updatedTransaction.userOpHash
    if (!userOpHash) {
      throw new Error('executeUserOp: submission did not produce a userOpHash')
    }

    return { userOpHash }
  }

  return {
    prepareAndSignTransaction,
    submitTransaction,
    submitTransactionSync,
    executeTransaction,
    executeUserOp,
    getNextNonce,
  }
}
