import { providers } from 'ethers'

/**
 * Ethereum transaction type constants
 * @see https://eips.ethereum.org/EIPS/eip-2718
 */
export const EthereumTransactionType = {
  /** Legacy transaction (pre-EIP-2718) */
  Legacy: 0,
  /** EIP-2930: Access list transaction */
  AccessList: 1,
  /** EIP-1559: Fee market transaction */
  EIP1559: 2,
} as const

/**
 * Cleans up incompatible gas pricing fields from transaction requests.
 *
 * Some dapps send malformed transactions with incompatible gas fields:
 * - EIP-1559 transactions (type 2) should NOT have `gasPrice`
 * - Legacy transactions (type 0/1) should NOT have `maxFeePerGas` or `maxPriorityFeePerGas`
 *
 * This function removes the incompatible fields to prevent errors during transaction processing.
 *
 * IMPORTANT: This should only be applied to transactions that have an explicit type field set.
 * Transactions without a type field are unpopulated and should be left as-is to allow ethers
 * to properly populate them based on network capabilities.
 *
 * @param request - The transaction request to clean
 * @returns A cleaned transaction request with only compatible gas fields
 */
export function cleanTransactionGasFields(request: providers.TransactionRequest): providers.TransactionRequest {
  // Only clean transactions that have an explicit type field set
  // If type is undefined, the transaction hasn't been populated yet and we shouldn't modify it
  if (request.type === undefined) {
    return request
  }

  const txType = Number(request.type)

  // EIP-1559 transaction: remove gasPrice if present
  if (txType === EthereumTransactionType.EIP1559 && request.gasPrice !== undefined) {
    const { gasPrice: _gasPrice, ...cleanedRequest } = request
    return cleanedRequest
  }

  // Legacy or EIP-2930 transaction: remove EIP-1559 gas fields if present
  if (
    (txType === EthereumTransactionType.Legacy || txType === EthereumTransactionType.AccessList) &&
    (request.maxFeePerGas !== undefined || request.maxPriorityFeePerGas !== undefined)
  ) {
    const { maxFeePerGas: _maxFeePerGas, maxPriorityFeePerGas: _maxPriorityFeePerGas, ...cleanedRequest } = request
    return cleanedRequest
  }

  // No incompatible fields, return as-is
  return request
}
