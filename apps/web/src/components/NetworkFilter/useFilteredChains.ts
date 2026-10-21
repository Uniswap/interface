import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isBackendSupportedChainId, isTestnetChain } from 'uniswap/src/features/chains/utils'

function orderFilterChainIds({
  chains,
  enabledChainIds,
  isTestnetModeEnabled,
}: {
  chains: UniverseChainId[] | undefined
  enabledChainIds: UniverseChainId[]
  isTestnetModeEnabled: boolean
}): UniverseChainId[] {
  const enabledChainIdSet = new Set(enabledChainIds)
  const chainsToFilter = (chains ?? enabledChainIds).filter((c) => enabledChainIdSet.has(c))
  const mainnetChainIds = chainsToFilter.filter(isBackendSupportedChainId).filter((c) => !isTestnetChain(c))
  const testnetChainIds = chainsToFilter.filter(isBackendSupportedChainId).filter(isTestnetChain)
  const unsupportedMainnetChainIds = chainsToFilter.filter((c) => !isBackendSupportedChainId(c) && !isTestnetChain(c))
  return [...mainnetChainIds, ...(isTestnetModeEnabled ? testnetChainIds : []), ...unsupportedMainnetChainIds]
}

export function useFilteredChainIds(chains?: UniverseChainId[]): UniverseChainId[] {
  const { chains: enabledChainIds, isTestnetModeEnabled } = useEnabledChains({ includeTestnets: true })
  return useMemo(
    () => orderFilterChainIds({ chains, enabledChainIds, isTestnetModeEnabled }),
    [chains, enabledChainIds, isTestnetModeEnabled],
  )
}

export interface NetworkFilterChainIds {
  chainIds: UniverseChainId[]
  allNetworksChainIds: UniverseChainId[] | undefined
}

export function useNetworkFilterChainIds(networks?: UniverseChainId[]): NetworkFilterChainIds {
  const { chains: enabledChainIds, isTestnetModeEnabled } = useEnabledChains({ includeTestnets: true })
  return useMemo(() => {
    const chainIds = orderFilterChainIds({ chains: networks, enabledChainIds, isTestnetModeEnabled })
    const allChainIds = orderFilterChainIds({ chains: undefined, enabledChainIds, isTestnetModeEnabled })
    return { chainIds, allNetworksChainIds: chainIds.length < allChainIds.length ? chainIds : undefined }
  }, [enabledChainIds, isTestnetModeEnabled, networks])
}
