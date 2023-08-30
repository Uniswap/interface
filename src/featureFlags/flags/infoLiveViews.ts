import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useInfoLiveViewsFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.infoLiveViews)
}
