import { ExperimentProperties } from 'uniswap/src/features/gating/experiments'
import type { FeatureFlags } from 'uniswap/src/features/gating/flags'

export interface FeatureFlagService {
  isFeatureEnabled(flagName: FeatureFlags): boolean
  getExperimentValue<E extends keyof ExperimentProperties, P extends ExperimentProperties[E], T>(
    experiment: E,
    property: P,
    defaultValue: T,
  ): T
}
