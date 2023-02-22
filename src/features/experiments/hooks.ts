import { useAppSelector } from 'src/app/hooks'
import { EXPERIMENTS, EXP_VARIANTS, FEATURE_FLAGS } from 'src/features/experiments/constants'
import { selectExperiment } from 'src/features/experiments/selectors'
import { useGate } from 'statsig-react-native'

export function useExperimentVariant(
  experimentName: EXPERIMENTS,
  defaultVariant: EXP_VARIANTS
): string {
  return useAppSelector(selectExperiment(experimentName)) ?? defaultVariant
}

// This is a custom hook that we created to make it easier to use feature flags, with better typing support for feature flags added in constants.ts.
export function useFeatureFlag(flagName: FEATURE_FLAGS): boolean {
  const { value } = useGate(flagName)
  return value
}

export function useFiatOnRampEnabled(): boolean {
  const { value } = useGate(FEATURE_FLAGS.FiatOnRamp)
  return value
}
