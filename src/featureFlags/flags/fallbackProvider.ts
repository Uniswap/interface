import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useFallbackProviderEnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.fallbackProvider)
}

export function useFallbackProviderEnabled(): boolean {
  return useFallbackProviderEnabledFlag() === BaseVariant.Enabled
}
