import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

function useDummyGateFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.statsigDummy, BaseVariant.Control)
}

export function useDummyGateEnabled(): boolean {
  return useDummyGateFlag() === BaseVariant.Enabled
}
