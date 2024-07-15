import { DynamicConfigs, QuickRouteChainsConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { InterfaceChainId, WEB_SUPPORTED_CHAIN_IDS } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'

export function useQuickRouteChains(): InterfaceChainId[] {
  const chains = useDynamicConfigValue(
    DynamicConfigs.QuickRouteChains,
    QuickRouteChainsConfigKey.Chains,
    [] as InterfaceChainId[],
    (x: unknown) => Array.isArray(x) && x.every((c: unknown) => typeof c === 'number'),
  )
  if (chains.every((c) => WEB_SUPPORTED_CHAIN_IDS.includes(c))) {
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
