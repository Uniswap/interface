import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useFallbackProviderFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.fallbackProvider)
}

export function useFallbackProviderFlagEnabled(): boolean {
  return useFallbackProviderFlag() === BaseVariant.Enabled
}
