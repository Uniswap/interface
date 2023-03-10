import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function usePayWithAnyTokenFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.payWithAnyToken, BaseVariant.Enabled)
}

export function usePayWithAnyTokenEnabled(): boolean {
  return usePayWithAnyTokenFlag() === BaseVariant.Enabled
}

export { BaseVariant as PayWithAnyTokenVariant }
