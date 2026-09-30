import { FeatureFlags } from '@universe/gating/src/flags'
import { useFeatureFlag, useFeatureFlagWithLoading } from '@universe/gating/src/hooks'

function useIsTokenCategoriesEnabled(): boolean {
  return useFeatureFlag(FeatureFlags.TokenCategories)
}

function useIsTokenCategoriesEnabledWithLoading(): { value: boolean; isLoading: boolean } {
  return useFeatureFlagWithLoading(FeatureFlags.TokenCategories)
}

export { useIsTokenCategoriesEnabled, useIsTokenCategoriesEnabledWithLoading }
