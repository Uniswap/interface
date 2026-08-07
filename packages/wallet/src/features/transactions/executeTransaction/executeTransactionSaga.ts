import type { providers } from 'ethers'
import type { SagaIterator } from 'redux-saga'
import { call } from 'typed-redux-saga'
import type { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import type {
  TransactionOptions,
  TransactionOriginType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { createTransactionSagaDependencies } from 'wallet/src/features/transactions/factories/createTransactionSagaDependencies'
import { createTransactionServices } from 'wallet/src/features/transactions/factories/createTransactionServices'
import { DelegationType } from 'wallet/src/features/transactions/types/transactionSagaDependencies'

export interface ExecuteTransactionParams {
  // internal id used for tracking transactions before they're submitted
  // this is optional as an override in txDetail.id calculation
  txId?: string
  chainId: UniverseChainId
  account: SignerMnemonicAccountMeta
  options: TransactionOptions & { request: providers.TransactionRequest }
  transactionOriginType: TransactionOriginType
  /** When undefined, the transaction is submitted but not added to the local state */
  typeInfo?: TransactionTypeInfo
  analytics?: SwapTradeBaseProperties
  /** Pre-signed transaction to skip signing step */
  preSignedTransaction?: SignedTransactionRequest
  /**
   * Initial local status for the registered tx. Defaults to Pending — never change the default.
   * `Cancelling` is used by the tracked UniswapX cancel flow; widen this union deliberately if a
   * new in-flight status ever needs to register here.
   */
  initialStatus?: TransactionStatus.Pending | TransactionStatus.Cancelling
}

// A utility for sagas to send transactions
// All outgoing transactions should go through here

/**
 * Execute a transaction using clean architecture principles.
 * This saga orchestrates the transaction execution process.
 */
export function* executeTransaction(params: ExecuteTransactionParams): SagaIterator<{
  transactionHash: string
}> {
  // Extract parameters for the transaction
  const {
    chainId,
    account,
    options,
    typeInfo,
    txId,
    transactionOriginType,
    analytics,
    preSignedTransaction,
    initialStatus,
  } = params

  const dependencies = createTransactionSagaDependencies()

  const delegationType =
    typeInfo?.type === TransactionType.RemoveDelegation ? DelegationType.RemoveDelegation : DelegationType.Auto

  const { transactionService } = yield* call(createTransactionServices, dependencies, {
    account,
    chainId,
    submitViaPrivateRpc: options.submitViaPrivateRpc ?? false,
    delegationType,
    request: options.request,
  })

  // Execute the transaction using the transaction service
  const result = yield* call([transactionService, transactionService.executeTransaction], {
    chainId,
    account,
    options,
    typeInfo,
    txId,
    transactionOriginType,
    analytics,
    preSignedTransaction,
    initialStatus,
  })

  return result
}
