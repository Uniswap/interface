import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChainId, isTestnetChain } from 'uniswap/src/features/chains/utils'

export function useFilteredChainIds(chains?: UniverseChainId[]): UniverseChainId[] {
  const { isTestnetModeEnabled } = useEnabledChains()
  const { chains: enabledChainIds } = useEnabledChains({ includeTestnets: true })
  const chainsToFilter = chains ?? enabledChainIds
  const mainnetChainIds = chainsToFilter.filter(isBackendSupportedChainId).filter((c) => !isTestnetChain(c))
  const testnetChainIds = chainsToFilter.filter(isBackendSupportedChainId).filter(isTestnetChain)
  const unsupportedMainnetChainIds = chainsToFilter.filter((c) => !isBackendSupportedChainId(c) && !isTestnetChain(c))
  return [...mainnetChainIds, ...(isTestnetModeEnabled ? testnetChainIds : []), ...unsupportedMainnetChainIds]
}
