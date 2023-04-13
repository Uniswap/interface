import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useDetailsV2Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.detailsV2)
}

export function useDetailsV2Enabled(): boolean {
  return useDetailsV2Flag() === BaseVariant.Enabled
}

export { BaseVariant as DetailsV2Variant }
