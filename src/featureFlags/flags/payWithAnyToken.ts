import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function usePayWithAnyTokenFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.payWithAnyToken)
}

export { BaseVariant as PayWithAnyTokenVariant }
