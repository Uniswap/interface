import { useAppSelector } from 'src/app/hooks'
import { selectExperiment, selectFeatureFlag } from 'src/features/experiments/selectors'

export function useExperimentVariant(experimentName: string, defaultVariant: string): string {
  return useAppSelector(selectExperiment(experimentName)) ?? defaultVariant
}

export function useFeatureFlag(flagName: string, defaultValue: boolean): boolean {
  return useAppSelector(selectFeatureFlag(flagName)) ?? defaultValue
}
