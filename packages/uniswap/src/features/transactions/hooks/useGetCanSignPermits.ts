import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useHasAccountMismatchCallback } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { useEvent } from 'utilities/src/react/hooks'

export function useGetCanSignPermits(): (chainId?: UniverseChainId) => boolean {
  const forceTrue = useFeatureFlag(FeatureFlags.ForcePermitTransactions)
  const mismatchUXEnabled = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const getHasMismatch = useHasAccountMismatchCallback()

  return useEvent((chainId?: UniverseChainId) => {
    return forceTrue || (getHasMismatch(chainId) && mismatchUXEnabled)
  })
}
