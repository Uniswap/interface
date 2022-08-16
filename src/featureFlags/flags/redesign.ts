import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useRedesignFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.redesign)
}

export { BaseVariant as RedesignVariant }
