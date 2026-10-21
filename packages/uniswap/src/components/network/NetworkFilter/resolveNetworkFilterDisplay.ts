import type { UniverseChainId } from '@universe/chains'

interface ResolveNetworkFilterDisplayParams {
  chainIds: UniverseChainId[]
  selectedChain: UniverseChainId | null
  includeAllNetworks?: boolean
  defaultChainId: UniverseChainId
}

interface NetworkFilterDisplay {
  showAllNetworks: boolean
  displayedChainId: UniverseChainId | null
}

export function resolveNetworkFilterDisplay({
  chainIds,
  selectedChain,
  includeAllNetworks,
  defaultChainId,
}: ResolveNetworkFilterDisplayParams): NetworkFilterDisplay {
  const singleChainId = chainIds.length === 1 ? chainIds[0] : undefined
  const showAllNetworks = Boolean(includeAllNetworks) && singleChainId === undefined
  const displayedChainId = selectedChain ?? (showAllNetworks ? null : (singleChainId ?? defaultChainId))
  return { showAllNetworks, displayedChainId }
}
