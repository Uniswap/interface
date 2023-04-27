import { SupportedChainId } from 'constants/chains'
import { Maybe } from 'graphql/jsutils/Maybe'

/**
 * Returns the input chain ID if chain is supported. If not, return undefined
 * @param chainId a chain ID, which will be returned if it is a supported chain ID
 */
export function supportedChainId(chainId: Maybe<number>): SupportedChainId | undefined {
  if (typeof chainId === 'number' && chainId in SupportedChainId) {
    return chainId
  }
  return undefined
}
