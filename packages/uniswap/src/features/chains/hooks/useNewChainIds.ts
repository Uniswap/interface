import { ChainsConfigKey, DynamicConfigs, useDynamicConfigValue } from '@universe/gating'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { isUniverseChainIdArrayType } from 'uniswap/src/features/gating/typeGuards'

export function useNewChainIds(): UniverseChainId[] {
  const newChainIds = useDynamicConfigValue<DynamicConfigs.Chains, ChainsConfigKey.NewChainIds, UniverseChainId[]>({
    config: DynamicConfigs.Chains,
    key: ChainsConfigKey.NewChainIds,
    defaultValue: [],
    customTypeGuard: isUniverseChainIdArrayType,
  })

  // For some reason, in the test suite, `newChainIds` is undefined
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return useMemo(() => (newChainIds || []).filter(isUniverseChainId), [newChainIds])
}
