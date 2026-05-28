import { Experiments, NativeTokenPercentageBufferProperties, useExperimentValue } from '@universe/gating'

export function useNativeTokenPercentageBufferExperiment(): number {
  const bufferSize = useExperimentValue({
    experiment: Experiments.NativeTokenPercentageBuffer,
    param: NativeTokenPercentageBufferProperties.BufferSize,
    defaultValue: 1,
  })

  return bufferSize
}
