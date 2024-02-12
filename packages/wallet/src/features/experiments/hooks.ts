import {
  useExperiment,
  useExperimentWithExposureLoggingDisabled,
  useGate,
  useGateWithExposureLoggingDisabled,
} from 'statsig-react-native'
import { EXPERIMENT_NAMES, EXPERIMENT_PARAMS, FEATURE_FLAGS } from './constants'

export function useFeatureFlag(flagName: FEATURE_FLAGS): boolean {
  const { value } = useGate(flagName)
  return value
}

export function useFeatureFlagWithExposureLoggingDisabled(flagName: FEATURE_FLAGS): boolean {
  const { value } = useGateWithExposureLoggingDisabled(flagName)
  return value
}

export function useExperimentEnabled(experimentName: EXPERIMENT_NAMES): boolean {
  return useExperiment(experimentName).config.getValue(EXPERIMENT_PARAMS.Enabled) as boolean
}

export function useExperimentEnabledWithExposureLoggingDisabled(
  experimentName: EXPERIMENT_NAMES
): boolean {
  return useExperimentWithExposureLoggingDisabled(experimentName).config.getValue(
    EXPERIMENT_PARAMS.Enabled
  ) as boolean
}
