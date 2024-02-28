import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useSwapSmarterFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.swapSmarter)
}

export function useSwapSmarterEnabled(): boolean {
  return useSwapSmarterFlag() === BaseVariant.Enabled
}
