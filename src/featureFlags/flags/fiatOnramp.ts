import { BaseVariant } from '../index'

export function useFiatOnrampFlag(): BaseVariant {
  return BaseVariant.Enabled
  // return useBaseFlag(FeatureFlag.fiatOnramp)
}
