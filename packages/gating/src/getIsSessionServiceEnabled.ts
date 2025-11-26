import { getConfig } from '@universe/config'
import { FeatureFlags } from '@universe/gating/src/flags'
import { getFeatureFlag } from '@universe/gating/src/hooks'

function getIsSessionServiceEnabled(): boolean {
  return getConfig().enableSessionService || getFeatureFlag(FeatureFlags.SessionsServiceEnabled)
}

export { getIsSessionServiceEnabled }
