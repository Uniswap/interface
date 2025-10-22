import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChainId, isTestnetChain } from 'uniswap/src/features/chains/utils'

export function useFilteredChainIds(): UniverseChainId[] {
  const { isTestnetModeEnabled } = useEnabledChains()
  const { chains: enabledChainIds } = useEnabledChains({ includeTestnets: true })
  const mainnetChainIds = enabledChainIds.filter(isBackendSupportedChainId).filter((c) => !isTestnetChain(c))
  const testnetChainIds = enabledChainIds
    .filter(isBackendSupportedChainId)
    .filter(isTestnetChain)
    .filter((c) => c !== UniverseChainId.MonadTestnet)
  const unsupportedMainnetChainIds = enabledChainIds.filter((c) => !isBackendSupportedChainId(c) && !isTestnetChain(c))
  return [...mainnetChainIds, ...(isTestnetModeEnabled ? testnetChainIds : []), ...unsupportedMainnetChainIds]
}
