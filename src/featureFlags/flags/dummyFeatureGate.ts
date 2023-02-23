import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

function useDummyGateFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.statsigDummy)
}

export function useDummyGateEnabled(): boolean {
  return useDummyGateFlag() === BaseVariant.Enabled
}
