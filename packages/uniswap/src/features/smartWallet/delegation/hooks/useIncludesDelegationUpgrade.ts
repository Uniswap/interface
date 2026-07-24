import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Returns true when a pending transaction's delegation is a smart wallet *update*
 * (Calibur re-delegation: the wallet is already delegated to Uniswap on this chain,
 * but the latest delegation address differs from the current one) rather than a
 * first-time activation.
 *
 * Mirrors `isUpgradeUniswapDelegation` (packages/wallet delegation utils) expressed
 * over `SwapDelegationInfo`: `delegationInclusion` covers fresh-or-upgrade, and
 * `isWalletDelegatedToUniswap` rules out the fresh case (which has no current
 * delegation). Gated by the SmartWalletUpgradeNotice feature flag so the
 * "smart wallet update" disclosure can be rolled out independently.
 */
export function useIncludesDelegationUpgrade({
  chainId,
  includesDelegation,
}: {
  chainId: UniverseChainId
  includesDelegation?: boolean
}): boolean {
  const isUpgradeDisclosureEnabled = useFeatureFlag(FeatureFlags.SmartWalletUpgradeNotice)
  const getSwapDelegationInfo = useUniswapContextSelector((ctx) => ctx.getSwapDelegationInfo)

  if (!isUpgradeDisclosureEnabled || !includesDelegation) {
    return false
  }

  const delegationInfo = getSwapDelegationInfo?.(chainId)
  return Boolean(delegationInfo?.delegationInclusion && delegationInfo.isWalletDelegatedToUniswap)
}
