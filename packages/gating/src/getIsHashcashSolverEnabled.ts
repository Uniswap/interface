import { FeatureFlags } from '@universe/gating/src/flags'
import { getFeatureFlag, useFeatureFlag } from '@universe/gating/src/hooks'

function getIsHashcashSolverEnabled(): boolean {
  return getFeatureFlag(FeatureFlags.HashcashSolverEnabled)
}

function useIsHashcashSolverEnabled(): boolean {
  return useFeatureFlag(FeatureFlags.HashcashSolverEnabled)
}

export { getIsHashcashSolverEnabled, useIsHashcashSolverEnabled }
