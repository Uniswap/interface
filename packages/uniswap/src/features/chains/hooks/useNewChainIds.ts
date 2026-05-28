import { useMemo } from 'react'
import { UniverseChainId, isUniverseChainId } from 'uniswap/src/features/chains/types'
import { ChainsConfigKey, DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { isUniverseChainIdArrayType } from 'uniswap/src/features/gating/typeGuards'

export function useNewChainIds(): UniverseChainId[] {
  const newChainIds = useDynamicConfigValue(
    DynamicConfigs.Chains,
    ChainsConfigKey.NewChainIds,
    [],
    isUniverseChainIdArrayType,
  )
  return useMemo(() => newChainIds.filter(isUniverseChainId), [newChainIds])
}
