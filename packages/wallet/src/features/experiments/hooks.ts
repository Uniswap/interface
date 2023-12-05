import { useExperiment, useGate } from 'statsig-react-native'
import { EXPERIMENT_NAMES, EXPERIMENT_PARAMS, FEATURE_FLAGS } from './constants'

/**
 * Returns feature flag (gate) value from Statsig
 */
export function useFeatureFlag(flagName: FEATURE_FLAGS): boolean {
  const { value } = useGate(flagName)
  return value
}

/**
 * Returns if an experiment is enabled from Statsig
 */
export function useExperimentEnabled(experimentName: EXPERIMENT_NAMES): boolean {
  return useExperiment(experimentName).config.getValue(EXPERIMENT_PARAMS.Enabled) as boolean
}
