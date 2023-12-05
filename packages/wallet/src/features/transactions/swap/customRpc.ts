import { ChainId } from 'wallet/src/constants/chains'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
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
  const isMevBlockerFeatureEnabled = useFeatureFlag(FEATURE_FLAGS.MevBlocker)
  const isSwapProtectionSettingEnabled = useSwapProtectionSetting() === SwapProtectionSetting.On
  const isMevBlockerSupportedOnChain = chainId ? isPrivateRpcSupportedOnChain(chainId) : false

  return Boolean(
    isMevBlockerFeatureEnabled && isSwapProtectionSettingEnabled && isMevBlockerSupportedOnChain
  )
}
