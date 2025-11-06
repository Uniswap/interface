import type { providers, TypedDataDomain, TypedDataField } from 'ethers'
import { HexString } from 'utilities/src/addresses/hex'

// these are tied to the ethers.js types,
// but we should eventually move to our own types
// so we can use viem etc if we want!
export type TransactionPopulatedRequest = providers.TransactionRequest

export type TransactionSignerOutput = {
  transactionHash: string
  populatedRequest: TransactionPopulatedRequest
  timestampBeforeSign: number
  timestampBeforeSend: number
}

export type TransactionSignerInput = {
  request: providers.TransactionRequest
}

/**
 * Service for signing and sending transactions
 * Abstracts the transaction signing process
 */
export interface TransactionSigner {
  /**
   * Prepare a transaction
   * @param input The transaction request
   * @returns The populated transaction
   */
  prepareTransaction(input: TransactionSignerInput): Promise<TransactionPopulatedRequest>

  /**
   * Sign a transaction
   * @param input The transaction request
   * @returns The signed transaction
   */
  signTransaction(input: TransactionPopulatedRequest): Promise<HexString>

  /**
   * Sign a typed data
   * @param input The typed data
   * @returns The signed typed data
   */
  signTypedData(input: {
    domain: TypedDataDomain
    types: Record<string, TypedDataField[]>
    value: Record<string, unknown>
  }): Promise<string>

  /**
   * Send a transaction
   * @param input The signed transaction hex string
   * @returns The transaction hash
   */
  sendTransaction(input: { signedTx: HexString }): Promise<string>

  /**
   * Send a transaction synchronously and wait for receipt
   * @param input The signed transaction hex string
   * @returns The transaction receipt
   */
  sendTransactionSync(input: { signedTx: HexString }): Promise<providers.TransactionReceipt>
}
