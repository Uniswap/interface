import type { TransactionRequest } from '@ethersproject/abstract-provider'
import type { BigNumberish } from '@ethersproject/bignumber'
import { BigNumber } from '@ethersproject/bignumber'

function formatAsHexString(input?: BigNumberish): string | undefined {
  return input !== undefined ? BigNumber.from(input).toHexString() : input
}

/**
 * Converts fields in a transaction request to hex strings if they should be in hex format.
 *
 * This is useful for converting a transaction request to a hex string for use in a DApp request if for some
 * reason the target fields are not already in hex format.
 *
 * This function is idempotent so it's safe to call more than once on a singular transaction request
 */
export function hexlifyTransaction(transferTxRequest: TransactionRequest): TransactionRequest {
  const { value, nonce, gasLimit, gasPrice, maxPriorityFeePerGas, maxFeePerGas } = transferTxRequest
  return {
    ...transferTxRequest,
    ...(nonce !== undefined ? { nonce: formatAsHexString(nonce) } : {}),
    ...(value !== undefined ? { value: formatAsHexString(value) } : {}),
    ...(gasLimit !== undefined ? { gasLimit: formatAsHexString(gasLimit) } : {}),

    // only pass in for legacy chains
    ...(gasPrice !== undefined ? { gasPrice: formatAsHexString(gasPrice) } : {}),

    // only pass in for eip1559 tx
    ...(maxPriorityFeePerGas !== undefined && maxFeePerGas !== undefined
      ? {
          maxPriorityFeePerGas: formatAsHexString(maxPriorityFeePerGas),
          maxFeePerGas: formatAsHexString(maxFeePerGas),
        }
      : {}),
  }
}
