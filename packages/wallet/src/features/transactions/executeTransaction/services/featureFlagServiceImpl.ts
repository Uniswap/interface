import { ExperimentProperties } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getExperimentValue, getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { FeatureFlagService } from 'wallet/src/features/transactions/executeTransaction/services/featureFlagService'

export const createFeatureFlagService = (): FeatureFlagService => {
  return {
    isFeatureEnabled: (flagName: FeatureFlags): boolean => {
      return getFeatureFlag(flagName)
    },
    getExperimentValue: <E extends keyof ExperimentProperties, P extends ExperimentProperties[E], T>(
      experiment: E,
      property: P,
      defaultValue: T,
    ): T => {
      return getExperimentValue(experiment, property, defaultValue)
    },
  }
}
