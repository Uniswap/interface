import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'

export function useGetSwapDelegationAddress(): (chainId: UniverseChainId | undefined) => string | undefined {
  const smartWalletEnabled = useFeatureFlag(FeatureFlags.SmartWallet)
  const swap7702Disabled = useFeatureFlag(FeatureFlags.DisableSwap7702)

  return useEvent((_chainId: UniverseChainId | undefined) => {
    if (smartWalletEnabled && !swap7702Disabled) {
      return '0x227380efd3392EC33cf148Ade5e0a89D33121814' // TODO: Implement
    }

    return undefined
  })
}
