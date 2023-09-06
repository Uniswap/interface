import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useInfoExploreFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.infoExplore)
}
