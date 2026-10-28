import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isBackendSupportedChainId, isTestnetChain } from 'uniswap/src/features/chains/utils'

export interface FilterChainIdsOptions {
  singleModeNetworks?: boolean
}

function orderFilterChainIds({
  chains,
  enabledChainIds,
  isTestnetModeEnabled,
  singleModeNetworks,
}: {
  chains: UniverseChainId[] | undefined
  enabledChainIds: UniverseChainId[]
  isTestnetModeEnabled: boolean
} & FilterChainIdsOptions): UniverseChainId[] {
  const enabledChainIdSet = new Set(enabledChainIds)
  const chainsToFilter = (chains ?? enabledChainIds).filter((c) => enabledChainIdSet.has(c))
  const testnetChainIds = chainsToFilter.filter(isBackendSupportedChainId).filter(isTestnetChain)
  if (isTestnetModeEnabled && singleModeNetworks) {
    return testnetChainIds
  }
  const mainnetChainIds = chainsToFilter.filter(isBackendSupportedChainId).filter((c) => !isTestnetChain(c))
  const unsupportedMainnetChainIds = chainsToFilter.filter((c) => !isBackendSupportedChainId(c) && !isTestnetChain(c))
  return [...mainnetChainIds, ...(isTestnetModeEnabled ? testnetChainIds : []), ...unsupportedMainnetChainIds]
}

export function useFilteredChainIds(
  chains?: UniverseChainId[],
  { singleModeNetworks }: FilterChainIdsOptions = {},
): UniverseChainId[] {
  const { chains: enabledChainIds, isTestnetModeEnabled } = useEnabledChains({ includeTestnets: true })
  return useMemo(
    () =>
      orderFilterChainIds({
        chains,
        enabledChainIds,
        isTestnetModeEnabled,
        singleModeNetworks,
      }),
    [chains, enabledChainIds, isTestnetModeEnabled, singleModeNetworks],
  )
}

export interface NetworkFilterChainIds {
  chainIds: UniverseChainId[]
  allNetworksChainIds: UniverseChainId[] | undefined
}

export function useNetworkFilterChainIds(
  networks?: UniverseChainId[],
  { singleModeNetworks }: FilterChainIdsOptions = {},
): NetworkFilterChainIds {
  const { chains: enabledChainIds, isTestnetModeEnabled } = useEnabledChains({ includeTestnets: true })
  return useMemo(() => {
    const options = { enabledChainIds, isTestnetModeEnabled, singleModeNetworks }
    const chainIds = orderFilterChainIds({ chains: networks, ...options })
    const allChainIds = orderFilterChainIds({ chains: undefined, ...options })
    return { chainIds, allNetworksChainIds: chainIds.length < allChainIds.length ? chainIds : undefined }
  }, [enabledChainIds, isTestnetModeEnabled, networks, singleModeNetworks])
}
