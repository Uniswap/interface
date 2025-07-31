import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

export const isSignTypedDataRequest = (request: { type: EthMethod }): boolean =>
  request.type === EthMethod.SignTypedData || request.type === EthMethod.SignTypedDataV4

/**
 * Checks if a transaction or call is a self-call with data
 * @param from The sender address
 * @param to The recipient address
 * @param data The transaction data
 * @returns True if this is a self-call with data, false otherwise
 */
export function isSelfCallWithData({ from, to, data }: { from?: string; to?: string; data?: string }): boolean {
  return (
    !!from &&
    !!to &&
    // TODO(WALL-7065): Update to support solana
    areAddressesEqual({
      addressInput1: { address: from, platform: Platform.EVM },
      addressInput2: { address: to, platform: Platform.EVM },
    }) &&
    data !== undefined &&
    data !== '0x'
  )
}
