import { useMemo } from 'react'
import { ALL_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'
import { ChainsConfigKey, DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

// Returns the given chains ordered based on the statsig config
export function useOrderedChainIds(chainIds: UniverseChainId[]): UniverseChainId[] {
  const serverOrderedChains = useDynamicConfigValue(
    DynamicConfigs.Chains,
    ChainsConfigKey.OrderedChainIds,
    ALL_CHAIN_IDS,
  )

  return useMemo(() => {
    const orderedChains = serverOrderedChains.filter((c) => chainIds.includes(c))
    const unspecifiedChains = chainIds.filter((c) => !serverOrderedChains.includes(c))
    return [...orderedChains, ...unspecifiedChains]
  }, [serverOrderedChains, chainIds])
}
