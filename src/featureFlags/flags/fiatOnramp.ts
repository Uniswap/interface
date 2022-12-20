import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useFiatOnrampFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.fiatOnramp)
}
