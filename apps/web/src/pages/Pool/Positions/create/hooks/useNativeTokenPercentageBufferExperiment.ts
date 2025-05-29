import { Experiments, NativeTokenPercentageBufferProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValue } from 'uniswap/src/features/gating/hooks'

export function useNativeTokenPercentageBufferExperiment() {
  const bufferSize = useExperimentValue(
    Experiments.NativeTokenPercentageBuffer,
    NativeTokenPercentageBufferProperties.BufferSize,
    1,
  )

  return bufferSize
}
