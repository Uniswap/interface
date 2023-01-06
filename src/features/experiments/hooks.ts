import { useAppSelector } from 'src/app/hooks'
import { EXPERIMENTS, EXP_VARIANTS, FEATURE_FLAGS } from 'src/features/experiments/constants'
import { selectExperiment, selectFeatureFlag } from 'src/features/experiments/selectors'

export function useExperimentVariant(
  experimentName: EXPERIMENTS,
  defaultVariant: EXP_VARIANTS
): string {
  return useAppSelector(selectExperiment(experimentName)) ?? defaultVariant
}

export function useFeatureFlag(flagName: FEATURE_FLAGS, defaultValue: boolean): boolean {
  return useAppSelector(selectFeatureFlag(flagName)) ?? defaultValue
}

export function useFiatOnRampEnabled(): boolean {
  return useFeatureFlag(FEATURE_FLAGS.FiatOnRamp, false)
}
