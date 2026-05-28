import { FeatureFlags } from 'uniswap/src/features/gating/flags'

/**
 * Feature flag overrides configuration
 * Allows force-disabling feature flags regardless of Statsig backend configuration
 */

// Parse force-disabled flags from environment variable
const FORCE_DISABLED_FLAGS = new Set<FeatureFlags>(
  process.env.REACT_APP_FORCE_DISABLED_FLAGS?.split(',')
    .map((flag) => {
      const trimmedFlag = flag.trim()
      // Support both enum keys and string values
      return FeatureFlags[trimmedFlag as keyof typeof FeatureFlags]
    })
    .filter((flag) => flag !== undefined) ?? [],
)

// Quick toggle to disable all UniswapX-related flags
// Disabled by default, only enabled when explicitly set to 'true'
if (process.env.REACT_APP_ENABLE_UNISWAPX !== 'true') {
  FORCE_DISABLED_FLAGS.add(FeatureFlags.UniswapX)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.ShowSell)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.ShowBuy)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.ShowLimit)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.AATestWeb)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.ArbitrumDutchV3)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.Datadog)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.GoogleConversionTracking)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.EmbeddedWallet)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.LpIncentives)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.ShowLandingSwap)
  FORCE_DISABLED_FLAGS.add(FeatureFlags.ShowNavBarSearch)
  // FORCE_DISABLED_FLAGS.add(FeatureFlags.UniswapXPriorityOrdersBase)
  // FORCE_DISABLED_FLAGS.add(FeatureFlags.UniswapXPriorityOrdersOptimism)
  // FORCE_DISABLED_FLAGS.add(FeatureFlags.UniswapXPriorityOrdersUnichain)
}

/**
 * Check if a feature flag is force-disabled via environment configuration
 * @param flag - The feature flag to check
 * @returns true if the flag should be force-disabled
 */
export function isFeatureFlagForceDisabled(flag: FeatureFlags): boolean {
  const isForceDisabled = FORCE_DISABLED_FLAGS.has(flag)
  // console.log('isFeatureFlagForceDisabled', flag, isForceDisabled)
  return isForceDisabled
}

/**
 * Get all force-disabled flags (for debugging/logging)
 */
export function getForceDisabledFlags(): FeatureFlags[] {
  return Array.from(FORCE_DISABLED_FLAGS)
}
