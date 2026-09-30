import { Experiments, Layers, V2EndpointsSearchProperties } from '@universe/gating/src/experiments'
import { useExperimentValueFromLayer } from '@universe/gating/src/hooks'

/**
 * Search V2 endpoints arm of the Discovery layer. Read through the layer (not the experiment) so the
 * exposure is attributed to whichever experiment currently owns the param, and users bucketed into a
 * sibling experiment in the layer get the layer default (off).
 */
function useIsV2EndpointsSearchEnabled(): boolean {
  return useExperimentValueFromLayer<typeof Layers.Discovery, Experiments.V2EndpointsSearch, boolean>({
    layerName: Layers.Discovery,
    param: V2EndpointsSearchProperties.V2EndpointsSearchEnabled,
    defaultValue: false,
  })
}

export { useIsV2EndpointsSearchEnabled }
