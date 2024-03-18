import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useUniconV2Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.uniconV2)
}
