import { SUPPORTED_V2POOL_CHAIN_IDS } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function useNetworkSupportsV2() {
  const { chainId } = useAccount()
  const isV2EverywhereEnabled = useFeatureFlag(FeatureFlags.V2Everywhere)

  return chainId && isV2EverywhereEnabled && SUPPORTED_V2POOL_CHAIN_IDS.includes(chainId)
}
