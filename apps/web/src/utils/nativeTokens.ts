import { GraphQLApi } from '@universe/api'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { supportedChainIdFromGQLChain } from '~/data/chainUtils'

export function getNativeTokenDBAddress(chain: GraphQLApi.Chain): string | undefined {
  const pageChainId = supportedChainIdFromGQLChain(chain)
  if (pageChainId === undefined) {
    return undefined
  }

  return getChainInfo(pageChainId).backendChain.nativeTokenBackendAddress
}
