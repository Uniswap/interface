import { GraphQLApi } from '@universe/api'
import { GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, isBackendSupportedChain } from 'uniswap/src/features/chains/utils'

export function supportedChainIdFromGQLChain(chain: GqlChainId): UniverseChainId
export function supportedChainIdFromGQLChain(chain: GraphQLApi.Chain): UniverseChainId | undefined
export function supportedChainIdFromGQLChain(chain: GraphQLApi.Chain): UniverseChainId | undefined {
  return isBackendSupportedChain(chain) ? (fromGraphQLChain(chain) ?? undefined) : undefined
}
