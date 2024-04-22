import { ChainId } from '@uniswap/sdk-core'
import { DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { useDynamicConfig } from 'uniswap/src/features/gating/hooks'

export const QUICK_ROUTE_CONFIG_KEY = 'quick_route_chains'

export function useQuickRouteChains(): ChainId[] {
  const statsigConfig = useDynamicConfig(DynamicConfigs.QuickRouteChains)
  const chains = statsigConfig.get(QUICK_ROUTE_CONFIG_KEY, []) as ChainId[]
  if (chains.every((c) => Object.values(ChainId).includes(c))) {
    return chains
  } else {
    console.error('dynamic config chains contain invalid ChainId')
    return []
  }
}
