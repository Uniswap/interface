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
import { type RpcUserOperation } from 'viem/account-abstraction'
import type { ExecuteTransactionParams } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import type { CalculatedNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'

export interface PrepareTransactionParams {
  chainId: UniverseChainId
  account: AccountMeta
  request: providers.TransactionRequest
  submitViaPrivateRpc: boolean
}

type SubmitTransactionParamsBase = {
  txId?: string
  chainId: UniverseChainId
  account: SignerMnemonicAccountMeta
  options: TransactionOptions
  transactionOriginType: TransactionOriginType
  // When undefined, the transaction is submitted but not added to the local state
  typeInfo?: TransactionTypeInfo
  analytics?: SwapTradeBaseProperties
}

export type EoaSubmitTransactionParams = SubmitTransactionParamsBase & {
  request: SignedTransactionRequest
  userOp?: never
}

export type UserOpSubmitTransactionParams = SubmitTransactionParamsBase & {
  request?: never
  userOp: RpcUserOperation<'0.8'>
  // When true, the service requests Uniswap gas sponsorship to fill paymaster fields before signing.
  requestUniswapGasSponsorship: boolean
  paymasterServiceContext?: Record<string, unknown>
}

export type SubmitTransactionParams = EoaSubmitTransactionParams | UserOpSubmitTransactionParams

export type SubmitTransactionParamsWithTypeInfo = SubmitTransactionParams & {
  typeInfo: TransactionTypeInfo
}

export type ExecuteUserOpParams = UserOpSubmitTransactionParams & {
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
  prepareAndSignTransaction: (input: PrepareTransactionParams) => Promise<SignedTransactionRequest>

  /**
   * Send a transaction to the blockchain
   * @param input Transaction parameters
   * @returns The transaction response
   */
  submitTransaction: (input: SubmitTransactionParams) => Promise<{
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
  submitTransactionSync: (input: SubmitTransactionParamsWithTypeInfo) => Promise<TransactionDetails>

  /**
   * Execute a transaction by preparing, signing, and submitting it
   * If a pre-signed transaction is provided, it will skip the preparation and signing steps
   * @param input Transaction parameters
   * @returns The transaction response
   */
  executeTransaction: (input: ExecuteTransactionParams) => Promise<{
    transactionHash: string
  }>

  /**
   * Execute a 4337 UserOperation: optionally sponsor it, sign it, and submit it to the bundler.
   *
   * @param input UserOp parameters
   * @returns The userOp hash returned by the bundler
   */
  executeUserOp: (input: ExecuteUserOpParams) => Promise<{ userOpHash: string }>

  /**
   * Calculate the next nonce for an account on a chain
   * @param account The account metadata
   * @param chainId The blockchain chain ID
   * @param submitViaPrivateRpc Whether to use private RPC submission
   * @returns The calculated nonce and optionally pending tx count
   * @throws {Error} When the nonce cannot be calculated due to network or validation issues
   */
  getNextNonce: (input: {
    account: AccountMeta
    chainId: UniverseChainId
    submitViaPrivateRpc?: boolean
  }) => Promise<CalculatedNonce>
}
