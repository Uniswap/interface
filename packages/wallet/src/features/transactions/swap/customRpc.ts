import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { useSwapProtectionSetting } from 'wallet/src/features/wallet/hooks'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

/**
 * Send txn through private RPC if following conditions are met:
 *
 * 1. Private RPC feature flag is enabled, aka they are in test group
 * 2. Swap protection setting is enabled (users sets this in swap settings)
 * 3. Private RPC is supported on chain
 *
 */
export function useShouldUsePrivateRpc(chainId: Maybe<UniverseChainId>): boolean {
  const privateRpcFeatureEnabled = useFeatureFlag(FeatureFlags.PrivateRpc)
  const swapProtectionSettingEnabled = useSwapProtectionSetting() === SwapProtectionSetting.On
  const privateRpcSupportedOnChain = chainId ? isPrivateRpcSupportedOnChain(chainId) : false

  return Boolean(privateRpcFeatureEnabled && swapProtectionSettingEnabled && privateRpcSupportedOnChain)
}
