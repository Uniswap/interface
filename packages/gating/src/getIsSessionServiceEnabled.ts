import { getConfig } from '@universe/config'
import { FeatureFlags } from '@universe/gating/src/flags'
import { getFeatureFlag, useFeatureFlag } from '@universe/gating/src/hooks'

function getIsSessionServiceEnabled(): boolean {
  return getConfig().enableSessionService || getFeatureFlag(FeatureFlags.SessionsServiceEnabled)
}

function useIsSessionServiceEnabled(): boolean {
  const featureFlagEnabled = useFeatureFlag(FeatureFlags.SessionsServiceEnabled)
  return getConfig().enableSessionService || featureFlagEnabled
}

export { getIsSessionServiceEnabled, useIsSessionServiceEnabled }
