import { getChainInfo } from 'constants/chains'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function getNativeTokenDBAddress(chain: Chain): string | undefined {
  const pageChainId = supportedChainIdFromGQLChain(chain)
  if (pageChainId === undefined) {
    return undefined
  }

  return getChainInfo({ chainId: pageChainId }).backendChain.nativeTokenBackendAddress
}
