import type { FeatureFlags } from '@universe/gating'
import { ExperimentProperties } from '@universe/gating'

export interface FeatureFlagService {
  isFeatureEnabled(flagName: FeatureFlags): boolean
  getExperimentValue<E extends keyof ExperimentProperties, P extends ExperimentProperties[E], T>({
    experiment,
    property,
    defaultValue,
  }: {
    experiment: E
    property: P
    defaultValue: T
  }): T
}
