import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers'
import { useSwapProtectionSetting } from 'wallet/src/features/wallet/hooks'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

/**
 * Send txn through MEV blocker if following conditions are met:
 *
 * 1. MEV blocker feature flag is enabled, aka they are in test group
 * 2. Swap protection setting is enabled (users sets this in swap settings)
 * 3. MEV blocker is supported on chain
 *
 */
export function useShouldUseMEVBlocker(chainId: Maybe<ChainId>): boolean {
  const isMevBlockerFeatureEnabled = useFeatureFlag(FeatureFlags.MevBlocker)
  const isSwapProtectionSettingEnabled = useSwapProtectionSetting() === SwapProtectionSetting.On
  const isMevBlockerSupportedOnChain = chainId ? isPrivateRpcSupportedOnChain(chainId) : false

  return Boolean(
    isMevBlockerFeatureEnabled && isSwapProtectionSettingEnabled && isMevBlockerSupportedOnChain
  )
}
