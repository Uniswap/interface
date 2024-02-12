import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useV2EverywhereFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.v2Everywhere)
}

export function useV2EverywhereEnabled(): boolean {
  return useV2EverywhereFlag() === BaseVariant.Enabled
}
