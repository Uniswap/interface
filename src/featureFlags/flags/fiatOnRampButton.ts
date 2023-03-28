import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useFiatOnRampButtonFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.fiatOnRampButtonOnSwap, BaseVariant.Enabled)
}

export function useFiatOnRampButtonEnabled(): boolean {
  return useFiatOnRampButtonFlag() === BaseVariant.Enabled
}

export { BaseVariant as FiatOnRampButtonVariant }
