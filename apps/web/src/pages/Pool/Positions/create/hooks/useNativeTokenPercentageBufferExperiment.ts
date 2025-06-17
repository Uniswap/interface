import { Experiments, NativeTokenPercentageBufferProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValue } from 'uniswap/src/features/gating/hooks'

export function useNativeTokenPercentageBufferExperiment(): number {
  const bufferSize = useExperimentValue({
    experiment: Experiments.NativeTokenPercentageBuffer,
    param: NativeTokenPercentageBufferProperties.BufferSize,
    defaultValue: 1,
  })

  return bufferSize
}
