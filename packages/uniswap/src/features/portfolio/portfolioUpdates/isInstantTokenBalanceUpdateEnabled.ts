import { FeatureFlags, getFeatureFlagName, getStatsigClient } from '@universe/gating'

export function isInstantTokenBalanceUpdateEnabled(): boolean {
  return getStatsigClient().checkGate(getFeatureFlagName(FeatureFlags.InstantTokenBalanceUpdate))
}
