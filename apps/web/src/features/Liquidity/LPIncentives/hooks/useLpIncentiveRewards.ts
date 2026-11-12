import { useMemo } from 'react'
import { useGetPoolsRewards } from 'uniswap/src/data/apiClients/dataApiService/pools/getPoolsRewards'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import type { LpIncentiveRewards, PricedBalance } from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'
import { buildLpIncentiveRewards } from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'
import {
  lpIncentivesClaimedKey,
  selectRecentlyClaimedKeys,
  useLpIncentivesClaimedStore,
} from '~/features/Liquidity/LPIncentives/lpIncentivesClaimedStore'

// Reads wallet-level LP-incentive rewards (GetRewards) across every chain they're paid on and groups
// them by chain with a per-chain subtotal and an overall total — see buildLpIncentiveRewards for
// the dust filtering and ordering. USD values are supplied by the backend. A just-claimed token
// still reported by Merkl's stale cache is suppressed within the staleness window. Returns
// render-ready data for the rewards modal.
export function useLpIncentiveRewards(walletAddress?: string): LpIncentiveRewards {
  // No chainIds: the backend then reads every chain its rewards provider supports, so a campaign on a
  // new chain surfaces without a client change.
  const {
    data,
    isLoading: isRewardsLoading,
    isError: isRewardsError,
  } = useGetPoolsRewards({ walletAddress }, Boolean(walletAddress))
  const claimedAt = useLpIncentivesClaimedStore((state) => state.claimedAt)

  // Only surface rewards with a resolvable token on a supported chain, excluding any token this
  // wallet just claimed that Merkl's stale cache still reports. The store prunes expired entries
  // on a timer, so `claimedAt` changing is what re-runs this when a suppression window lapses.
  const balances = useMemo(() => {
    if (!walletAddress) {
      return []
    }
    const recentlyClaimed = selectRecentlyClaimedKeys(claimedAt, Date.now())
    return (data?.rewardBalances ?? []).filter(
      (balance): balance is PricedBalance =>
        balance.token !== undefined &&
        isUniverseChainId(balance.token.chainId) &&
        !recentlyClaimed.has(
          lpIncentivesClaimedKey({
            walletAddress,
            chainId: balance.token.chainId,
            tokenAddress: balance.token.address,
          }),
        ),
    )
  }, [data?.rewardBalances, claimedAt, walletAddress])

  return useMemo(
    () => buildLpIncentiveRewards({ balances, isRewardsLoading, isRewardsError }),
    [balances, isRewardsLoading, isRewardsError],
  )
}
