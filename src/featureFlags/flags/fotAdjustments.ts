import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useFotAdjustmentsFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.fotAdjustedmentsEnabled)
}

export function useFotAdjustmentsEnabled(): boolean {
  return useFotAdjustmentsFlag() === BaseVariant.Enabled
}
