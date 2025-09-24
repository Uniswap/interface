import { providers } from 'ethers/lib/ethers'
import type { AccountMeta, SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import {
  TransactionDetails,
  TransactionOptions,
  TransactionOriginType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { ExecuteTransactionParams } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import type { CalculatedNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'

export interface PrepareTransactionParams {
  chainId: UniverseChainId
  account: AccountMeta
  request: providers.TransactionRequest
  submitViaPrivateRpc: boolean
}

export interface SubmitTransactionParams {
  txId?: string
  chainId: UniverseChainId
  account: SignerMnemonicAccountMeta
  request: SignedTransactionRequest
  options: TransactionOptions
  transactionOriginType: TransactionOriginType
  // When undefined, the transaction is submitted but not added to the local state
  typeInfo?: TransactionTypeInfo
  analytics?: SwapTradeBaseProperties
}

export interface SubmitTransactionParamsWithTypeInfo extends SubmitTransactionParams {
  typeInfo: TransactionTypeInfo
}

/**
 * Main transaction service interface
 * Provides methods for transaction operations
 */
export interface TransactionService {
  /**
   * Prepare and sign a transaction
   * @param input Transaction parameters
   * @returns The prepared transaction
   */
  prepareAndSignTransaction(input: PrepareTransactionParams): Promise<SignedTransactionRequest>

  /**
   * Send a transaction to the blockchain
   * @param input Transaction parameters
   * @returns The transaction response
   */
  submitTransaction(input: SubmitTransactionParams): Promise<{
    transactionHash: string
  }>

  /**
   * Send a transaction to the blockchain synchronously, using the eth_sendRawTransactionSync method (EIP-7966)
   *
   * Use this method when:
   * - You need immediate confirmation of transaction inclusion
   * - The RPC provider supports EIP-7966
   *
   * Note: This blocks until the transaction is included in a block, which could take several seconds.
   *
   * @param input Transaction parameters
   * @returns The transaction details updated with the receipt
   */
  submitTransactionSync(input: SubmitTransactionParamsWithTypeInfo): Promise<TransactionDetails>

  /**
   * Execute a transaction by preparing, signing, and submitting it
   * If a pre-signed transaction is provided, it will skip the preparation and signing steps
   * @param input Transaction parameters
   * @returns The transaction response
   */
  executeTransaction(input: ExecuteTransactionParams): Promise<{
    transactionHash: string
  }>

  /**
   * Calculate the next nonce for an account on a chain
   * @param account The account metadata
   * @param chainId The blockchain chain ID
   * @param submitViaPrivateRpc Whether to use private RPC submission
   * @returns The calculated nonce and optionally pending tx count
   * @throws {Error} When the nonce cannot be calculated due to network or validation issues
   */
  getNextNonce(input: {
    account: AccountMeta
    chainId: UniverseChainId
    submitViaPrivateRpc?: boolean
  }): Promise<CalculatedNonce>
}
