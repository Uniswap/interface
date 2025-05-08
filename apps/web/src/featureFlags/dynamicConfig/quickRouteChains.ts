import { SUPPORTED_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'
import { DynamicConfigs, QuickRouteChainsConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { isUniverseChainIdArrayType } from 'uniswap/src/features/gating/typeGuards'
import { logger } from 'utilities/src/logger/logger'

export function useQuickRouteChains(): UniverseChainId[] {
  const chains = useDynamicConfigValue(
    DynamicConfigs.QuickRouteChains,
    QuickRouteChainsConfigKey.Chains,
    [],
    isUniverseChainIdArrayType,
  )

  if (chains.every((c) => SUPPORTED_CHAIN_IDS.includes(c))) {
    return chains
  } else {
    logger.error(new Error('dynamic config chains contain invalid ChainId'), {
      tags: {
        file: 'quickRouteChains',
        function: 'useQuickRouteChains',
      },
      extra: {
        chains,
      },
    })
    return []
  }
}
