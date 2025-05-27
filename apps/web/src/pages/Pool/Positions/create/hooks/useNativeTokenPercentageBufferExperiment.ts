import { Experiments, NativeTokenPercentageBufferExperimentGroup } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupNameWithLoading } from 'uniswap/src/features/gating/hooks'

export function useNativeTokenPercentageBufferExperiment() {
  const { value: nativeTokenPercentageBuffer } = useExperimentGroupNameWithLoading(
    Experiments.NativeTokenPercentageBuffer,
  )
  const controlPercentageBuffer = 0.5
  const bufferPercentage =
    nativeTokenPercentageBuffer === NativeTokenPercentageBufferExperimentGroup.Control ? controlPercentageBuffer : 1

  return bufferPercentage
}
