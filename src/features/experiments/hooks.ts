import { FEATURE_FLAGS } from 'src/features/experiments/constants'
import { useGate } from 'statsig-react-native'

/**
 * Returns feature flag (gate) value from Statsig
 */
export function useFeatureFlag(flagName: FEATURE_FLAGS): boolean {
  const { value } = useGate(flagName)
  return value
}

export function useFiatOnRampEnabled(): boolean {
  return useFeatureFlag(FEATURE_FLAGS.FiatOnRamp)
}
