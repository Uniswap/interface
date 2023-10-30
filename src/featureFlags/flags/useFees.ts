import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useFeesEnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.feesEnabled)
}

// wxc: router fee
export function useFeesEnabled(): boolean {
  return false; // useFeesEnabledFlag() === BaseVariant.Enabled
}
