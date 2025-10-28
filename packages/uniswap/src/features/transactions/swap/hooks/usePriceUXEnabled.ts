import { Experiments, Layers, PriceUxUpdateProperties, useExperimentValueFromLayer } from '@universe/gating'

export function usePriceUXEnabled(): boolean {
  const expValueFromLayer = useExperimentValueFromLayer<Layers.SwapPage, Experiments.PriceUxUpdate, boolean>({
    layerName: Layers.SwapPage,
    param: PriceUxUpdateProperties.UpdatedPriceUX,
    defaultValue: false,
  })

  return expValueFromLayer
}
