import { ExploreBackendSortingProperties, Layers, useExperimentValueFromLayer } from '@universe/gating'

/**
 * Hook that returns whether backend sorting is enabled for the Explore page.
 */
export function useExploreBackendSortingEnabled(): boolean {
  return useExperimentValueFromLayer({
    layerName: Layers.ExplorePage,
    param: ExploreBackendSortingProperties.BackendSortingEnabled,
    defaultValue: false,
  })
}
