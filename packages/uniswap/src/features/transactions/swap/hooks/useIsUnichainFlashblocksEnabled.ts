import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Experiments, Layers, UnichainFlashblocksProperties } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import {
  getExperimentValueFromLayer,
  getFeatureFlag,
  useExperimentValueFromLayer,
  useFeatureFlag,
} from 'uniswap/src/features/gating/hooks'
import { isWebApp } from 'utilities/src/platform'

/**
 * Hook to determine if Unichain flashblocks feature should be enabled
 * Returns true only when:
 * 1. The UnichainFlashblocks feature flag is enabled
 * 2. The UnichainFlashblocksModal experiment is enabled (via SwapPage layer) - only on interface
 * 3. The current chain is Unichain mainnet or Unichain sepolia
 */
export function useIsUnichainFlashblocksEnabled(chainId?: UniverseChainId): boolean {
  const flashblocksFlag = useFeatureFlag(FeatureFlags.UnichainFlashblocks)
  const flashblocksExperiment = useExperimentValueFromLayer<
    Layers.SwapPage,
    Experiments.UnichainFlashblocksModal,
    boolean
  >({
    layerName: Layers.SwapPage,
    param: UnichainFlashblocksProperties.FlashblocksModalEnabled,
    defaultValue: false,
  })

  // Check feature flag on all platforms
  if (!flashblocksFlag) {
    return false
  }

  // Only check experiment on interface platform
  if (isWebApp && !flashblocksExperiment) {
    return false
  }

  return chainId === UniverseChainId.Unichain || chainId === UniverseChainId.UnichainSepolia
}

/**
 * Sync function to check if Unichain flashblocks feature is enabled
 * Returns true only when:
 * 1. The UnichainFlashblocks feature flag is enabled
 * 2. The UnichainFlashblocksModal experiment is enabled (via SwapPage layer) - only on interface
 * 3. The current chain is Unichain mainnet or Unichain sepolia
 */
export function getIsFlashblocksEnabled(chainId?: UniverseChainId): boolean {
  const flashblocksFlag = getFeatureFlag(FeatureFlags.UnichainFlashblocks)
  const flashblocksExperiment = getExperimentValueFromLayer<
    Layers.SwapPage,
    Experiments.UnichainFlashblocksModal,
    boolean
  >({
    layerName: Layers.SwapPage,
    param: UnichainFlashblocksProperties.FlashblocksModalEnabled,
    defaultValue: false,
  })

  // Check feature flag on all platforms
  if (!flashblocksFlag) {
    return false
  }

  // Only check experiment on interface platform
  if (isWebApp && !flashblocksExperiment) {
    return false
  }

  return chainId === UniverseChainId.Unichain || chainId === UniverseChainId.UnichainSepolia
}
