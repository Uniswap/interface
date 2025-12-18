import { DynamicConfigs, OutageBannerChainIdConfigKey, useDynamicConfigValue } from '@universe/gating'
import { ChainOutageData } from 'state/outage/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function useChainOutageConfig(): ChainOutageData | undefined {
  const chainId = useDynamicConfigValue({
    config: DynamicConfigs.OutageBannerChainId,
    key: OutageBannerChainIdConfigKey.ChainId,
    defaultValue: undefined,
    customTypeGuard: (x): x is UniverseChainId | undefined => {
      return x === undefined || (typeof x === 'number' && x > 0)
    },
  })

  if (!chainId) {
    return undefined
  }

  return { chainId }
}
