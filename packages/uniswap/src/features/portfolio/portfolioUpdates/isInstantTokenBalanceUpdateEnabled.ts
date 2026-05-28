import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { getStatsigClient } from 'uniswap/src/features/gating/sdk/statsig'

export function isInstantTokenBalanceUpdateEnabled(): boolean {
  return getStatsigClient().checkGate(getFeatureFlagName(FeatureFlags.InstantTokenBalanceUpdate))
}
