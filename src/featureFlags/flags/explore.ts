import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useExploreFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.explore)
}

export { BaseVariant as ExploreVariant }
