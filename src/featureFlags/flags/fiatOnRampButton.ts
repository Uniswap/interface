import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

function useFiatOnRampButtonFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.fiatOnRampButtonOnSwap)
}

export function useFiatOnRampButtonEnabled(): boolean {
  return useFiatOnRampButtonFlag() === BaseVariant.Enabled
}
