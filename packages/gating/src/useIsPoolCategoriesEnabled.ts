import { FeatureFlags } from '@universe/gating/src/flags'
import { useFeatureFlag, useFeatureFlagWithLoading } from '@universe/gating/src/hooks'

function useIsPoolCategoriesEnabled(): boolean {
  return useFeatureFlag(FeatureFlags.PoolCategories)
}

function useIsPoolCategoriesEnabledWithLoading(): { value: boolean; isLoading: boolean } {
  return useFeatureFlagWithLoading(FeatureFlags.PoolCategories)
}

export { useIsPoolCategoriesEnabled, useIsPoolCategoriesEnabledWithLoading }
