import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useBaseEnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.baseEnabled)
}

export function useBaseEnabled(): boolean {
  return useBaseEnabledFlag() === BaseVariant.Enabled
}
