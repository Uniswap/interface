import { getConfig } from '@universe/config'
import { FeatureFlags } from '@universe/gating/src/flags'
import { getFeatureFlag } from '@universe/gating/src/hooks'

function getIsSessionUpgradeAutoEnabled(): boolean {
  return getConfig().enableSessionUpgradeAuto || getFeatureFlag(FeatureFlags.SessionsUpgradeAutoEnabled)
}

export { getIsSessionUpgradeAutoEnabled }
