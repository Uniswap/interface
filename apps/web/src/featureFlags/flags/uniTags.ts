import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useUniTagsFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.uniTags)
}

export function useUniTagsEnabled(): boolean {
  return useUniTagsFlag() === BaseVariant.Enabled
}
