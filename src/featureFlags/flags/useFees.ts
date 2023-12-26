import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useFeesEnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.feesEnabled)
}

export function useFeesEnabled(): boolean {
  return useFeesEnabledFlag() === BaseVariant.Enabled
}
