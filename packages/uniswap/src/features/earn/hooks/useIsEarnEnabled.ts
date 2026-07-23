import { FeatureFlags, getFeatureFlag, useFeatureFlag } from '@universe/gating'

export function getIsEarnEnabled(): boolean {
  return getFeatureFlag(FeatureFlags.Earn) && getFeatureFlag(FeatureFlags.ChainedActions)
}

export function useIsEarnEnabled(): boolean {
  const isEarnEnabled = useFeatureFlag(FeatureFlags.Earn)
  // Earn execution is built on chained-action quotes/plans, so both flags must be enabled.
  const isChainedActionsEnabled = useFeatureFlag(FeatureFlags.ChainedActions)

  return isEarnEnabled && isChainedActionsEnabled
}
