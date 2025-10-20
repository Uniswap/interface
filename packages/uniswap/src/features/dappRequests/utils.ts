import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
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
export function isSelfCallWithData({
  from,
  to,
  data,
  chainId,
}: {
  from?: string
  to?: string
  data?: string
  chainId?: UniverseChainId
}): boolean {
  return (
    !!from &&
    !!to &&
    areAddressesEqual({
      addressInput1: { address: from, chainId: chainId ?? UniverseChainId.Mainnet },
      addressInput2: { address: to, chainId: chainId ?? UniverseChainId.Mainnet },
    }) &&
    data !== undefined &&
    data !== '0x'
  )
}
