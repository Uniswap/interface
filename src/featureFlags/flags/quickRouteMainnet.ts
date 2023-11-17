import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useQuickRouteMainnetFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.quickRouteMainnet)
}

export function useQuickRouteMainnetEnabled(): boolean {
  return useQuickRouteMainnetFlag() === BaseVariant.Enabled
}
