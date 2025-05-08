import type { providers } from 'ethers'

// these are tied to the ethers.js types,
// but we should eventually move to our own types
// so we can use viem etc if we want!
export type TransactionResponse = providers.TransactionResponse
export type TransactionPopulatedRequest = providers.TransactionRequest
export type TransactionTimestampBeforeSend = number

export type TransactionSignerOutput = {
  transactionResponse: TransactionResponse
  populatedRequest: TransactionPopulatedRequest
  timestampBeforeSend: TransactionTimestampBeforeSend
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
   * Sign and send a transaction
   * @param input The transaction request
   * @returns The response, populated request, and timestamp
   */
  signAndSendTransaction(input: TransactionSignerInput): Promise<TransactionSignerOutput>

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
  signTransaction(input: TransactionPopulatedRequest): Promise<string>

  /**
   * Send a transaction
   * @param input The signed transaction hex string
   * @returns The transaction response
   */
  sendTransaction(input: { signedTx: string }): Promise<TransactionResponse>
}
