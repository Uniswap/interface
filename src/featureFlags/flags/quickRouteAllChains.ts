import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useQuickRouteAllChainsFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.quickRouteAllChains)
}

export function useQuickRouteAllChainsEnabled(): boolean {
  return useQuickRouteAllChainsFlag() === BaseVariant.Enabled
}
