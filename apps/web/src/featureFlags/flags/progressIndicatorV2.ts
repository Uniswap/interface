import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useProgressIndicatorV2Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.progressIndicatorV2)
}
