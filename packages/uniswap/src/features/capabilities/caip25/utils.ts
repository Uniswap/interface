import {
  CAIP25Namespace,
  MultipleChainsNamespaceScopeKey,
  SingleChainNamespaceScopeKey,
} from 'uniswap/src/features/capabilities/caip25/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function getScopeKey(params: {
  namespace: CAIP25Namespace
  chainIds: UniverseChainId[]
}): MultipleChainsNamespaceScopeKey | SingleChainNamespaceScopeKey {
  if (params.chainIds.length === 1) {
    return `${params.namespace}:${params.chainIds[0]}`
  }

  return params.namespace
}
