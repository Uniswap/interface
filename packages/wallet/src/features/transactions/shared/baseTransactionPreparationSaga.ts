import { call, type SagaGenerator } from 'typed-redux-saga'
import type { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import type {
  PrepareTransactionParams,
  TransactionService,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import type { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import type { CalculatedNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import type { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { createTransactionServices } from 'wallet/src/features/transactions/factories/createTransactionServices'
import type {
  DelegationType,
  TransactionSagaDependencies,
} from 'wallet/src/features/transactions/types/transactionSagaDependencies'

/**
 * Common metadata for all transaction types
 */
export interface BaseTransactionMetadata {
  timestampBeforeSign: number
  timestampAfterSign: number
  submitViaPrivateRpc: boolean
}

/**
 * Base parameters for transaction preparation
 */
export interface BaseTransactionPreparationParams {
  account: SignerMnemonicAccountMeta
  chainId: UniverseChainId
  submitViaPrivateRpc: boolean
  delegationType?: DelegationType
  onSuccess?: (result: unknown) => void
  onFailure?: (error: Error) => void
}

/**
 * Parameters for a single transaction signing operation
 */
export interface SingleTransactionSigningParams {
  chainId: UniverseChainId
  account: SignerMnemonicAccountMeta
  request: ValidatedTransactionRequest
  nonce?: number
  submitViaPrivateRpc: boolean
}

/**
 * Result of transaction preparation
 */
export interface TransactionPreparationResult {
  signedTransaction: SignedTransactionRequest
  metadata: BaseTransactionMetadata
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  sagaName: string
  functionName: string
  extraLogData?: Record<string, unknown>
}

/**
 * Shared utility for preparing transaction services and calculating nonce
 * This extracts the common setup logic used by multiple sagas
 */
export function* prepareTransactionServices(
  dependencies: TransactionSagaDependencies,
  params: {
    account: SignerMnemonicAccountMeta
    chainId: UniverseChainId
    submitViaPrivateRpc: boolean
    delegationType: DelegationType
    request?: ValidatedTransactionRequest
  },
): SagaGenerator<{
  transactionService: TransactionService
  transactionSigner: TransactionSigner
  calculatedNonce: CalculatedNonce | undefined
}> {
  const { transactionService, transactionSigner } = yield* call(createTransactionServices, dependencies, {
    account: params.account,
    chainId: params.chainId,
    submitViaPrivateRpc: params.submitViaPrivateRpc,
    delegationType: params.delegationType,
    request: params.request,
  })

  // Calculate nonce using TransactionService
  let calculatedNonce: CalculatedNonce | undefined
  try {
    calculatedNonce = yield* call(transactionService.getNextNonce, {
      account: params.account,
      chainId: params.chainId,
      submitViaPrivateRpc: params.submitViaPrivateRpc,
    })
  } catch (error) {
    // If the nonce cannot be calculated, we proceed with the flow because while populating
    // the transaction request, the nonce is calculated and set by the provider (without our custom logic).
    dependencies.logger.error(error, {
      tags: {
        file: 'baseTransactionPreparationSaga',
        function: 'prepareTransactionServices',
      },
      extra: { account: params.account, chainId: params.chainId },
    })
  }

  return { transactionService, transactionSigner, calculatedNonce }
}

/**
 * Shared utility for signing a single transaction
 * This extracts the common transaction preparation and signing logic
 */
export function* signSingleTransaction(
  transactionService: TransactionService,
  params: SingleTransactionSigningParams,
): SagaGenerator<TransactionPreparationResult> {
  const timestampBeforeSign = Date.now()

  const prepareTransactionParams: PrepareTransactionParams = {
    chainId: params.chainId,
    account: params.account,
    request: { ...params.request, nonce: params.nonce },
    submitViaPrivateRpc: params.submitViaPrivateRpc,
  }

  const signedTransaction: SignedTransactionRequest = yield* call(
    transactionService.prepareAndSignTransaction,
    prepareTransactionParams,
  )

  const metadata: BaseTransactionMetadata = {
    timestampBeforeSign,
    timestampAfterSign: Date.now(),
    submitViaPrivateRpc: params.submitViaPrivateRpc,
  }

  return { signedTransaction, metadata }
}

/**
 * Shared error handling pattern for transaction preparation sagas
 * This provides consistent error handling, logging, and callback invocation
 */
export function handleTransactionPreparationError(
  dependencies: TransactionSagaDependencies,
  errorInfo: {
    error: unknown
    chainId: UniverseChainId
    errorConfig: ErrorHandlingConfig
    onFailure?: (error: Error) => void
  },
): Error {
  const { error, chainId, errorConfig, onFailure } = errorInfo
  const errorMessage = `Failed to prepare and sign transaction: ${
    error instanceof Error ? error.message : 'Unknown error'
  }`

  dependencies.logger.error(error, {
    tags: { file: errorConfig.sagaName, function: errorConfig.functionName },
    extra: { chainId, ...errorConfig.extraLogData },
  })

  const formattedError = new Error(errorMessage, { cause: error })
  onFailure?.(formattedError)
  return formattedError
}
