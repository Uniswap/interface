import { BaseVariant } from '../index'

export function useFiatOnrampFlag(): BaseVariant {
  return BaseVariant.Control
  // return useBaseFlag(FeatureFlag.fiatOnramp)
}
