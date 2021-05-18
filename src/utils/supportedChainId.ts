import { ChainId } from '@uniswap/sdk-core'

/**
 * Returns the input chain ID if chain is supported. If not, return undefined
 * @param chainId a chain ID, which will be returned if it is a supported chain ID
 */
export function supportedChainId(chainId: number): ChainId | undefined {
  if (chainId in ChainId) {
    return chainId
  }
  return undefined
}
