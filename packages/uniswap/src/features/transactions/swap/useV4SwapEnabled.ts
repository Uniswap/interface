import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function useV4SwapEnabled(chainId?: number): boolean {
  const v4Enabled = useFeatureFlag(FeatureFlags.V4Swap)
  const supportedChainId = useSupportedChainId(chainId)

  if (!v4Enabled || !supportedChainId) {
    return false
  }

  const chainInfo = getChainInfo(supportedChainId)
  return chainInfo.supportsV4
}
