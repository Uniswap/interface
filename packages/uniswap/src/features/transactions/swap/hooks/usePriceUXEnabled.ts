import { Experiments, Layers, PriceUxUpdateProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValueFromLayer } from 'uniswap/src/features/gating/hooks'

export function usePriceUXEnabled(): boolean {
  const expValueFromLayer = useExperimentValueFromLayer<Layers.SwapPage, Experiments.PriceUxUpdate, boolean>(
    Layers.SwapPage,
    PriceUxUpdateProperties.UpdatedPriceUX,
    false,
  )

  return expValueFromLayer
}
