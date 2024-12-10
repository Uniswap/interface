import { useMemo } from 'react'
import { UniverseChainId, isUniverseChainId } from 'uniswap/src/features/chains/types'
import { ChainsConfigKey, DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

export function useNewChainIds(): UniverseChainId[] {
  const newChainIds = useDynamicConfigValue(DynamicConfigs.Chains, ChainsConfigKey.NewChainIds, [] as number[])
  return useMemo(() => newChainIds.filter(isUniverseChainId), [newChainIds])
}
