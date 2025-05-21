import { TransactionRequest } from 'uniswap/src/data/tradingApi/__generated__/models/TransactionRequest'
import { EthTransaction } from 'uniswap/src/types/walletConnect'

/**
 * Generates a random batch ID in the format of 0x followed by 64 hex characters
 * @returns A string in the format of 0x followed by 64 hex characters
 */
export function generateBatchId(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const hexBytes = Array.from(randomBytes).map((byte) => {
    return byte.toString(16).padStart(2, '0')
  })
  return `0x${hexBytes.join('')}`
}

/**
 * Transforms an array of EIP-1193 calls into TransactionRequest format for the Trading API.
 * Filters out any calls missing required fields.
 */
export function transformCallsToTransactionRequests(
  calls: EthTransaction[],
  chainId: number,
  accountAddress: Address,
): TransactionRequest[] {
  return calls
    .map((call): TransactionRequest | undefined => {
      if (call.to === undefined || call.data === undefined || !chainId) {
        return undefined
      }
      return {
        to: call.to,
        data: call.data,
        value: call.value ?? '0x0',
        from: accountAddress,
        chainId: chainId.valueOf(),
      }
    })
    .filter((call): call is TransactionRequest => !!call)
}
