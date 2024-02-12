import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useLimitsFeeesEnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.limitsFees)
}

export function useLimitsFeesEnabled(): boolean {
  return useLimitsFeeesEnabledFlag() === BaseVariant.Enabled
}
