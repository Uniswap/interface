import { Experiments, ForFiltersProperties, useExperimentValue } from '@universe/gating'

/**
 * Hook to determine if ForFilters feature should be enabled
 * Returns true when the ForFilters experiment is enabled
 */
export function useIsForFiltersEnabled(): boolean {
  const forFiltersExperiment = useExperimentValue({
    experiment: Experiments.ForFilters,
    param: ForFiltersProperties.ForFiltersEnabled,
    defaultValue: false,
  })

  return forFiltersExperiment
}
