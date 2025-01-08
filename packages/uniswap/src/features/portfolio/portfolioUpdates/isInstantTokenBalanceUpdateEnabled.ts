import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'

export function isInstantTokenBalanceUpdateEnabled(): boolean {
  return Statsig.checkGate(getFeatureFlagName(FeatureFlags.InstantTokenBalanceUpdate))
}
