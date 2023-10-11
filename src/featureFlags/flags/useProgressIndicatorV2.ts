import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useProgressIndicatorV2(): BaseVariant {
  return useBaseFlag(FeatureFlag.progressIndicatorV2)
}
