import { FeatureFlags } from '@universe/gating/src/flags'
import { getFeatureFlag, useFeatureFlag } from '@universe/gating/src/hooks'

function getIsTurnstileSolverEnabled(): boolean {
  return getFeatureFlag(FeatureFlags.TurnstileSolverEnabled)
}

function useIsTurnstileSolverEnabled(): boolean {
  return useFeatureFlag(FeatureFlags.TurnstileSolverEnabled)
}

export { getIsTurnstileSolverEnabled, useIsTurnstileSolverEnabled }
