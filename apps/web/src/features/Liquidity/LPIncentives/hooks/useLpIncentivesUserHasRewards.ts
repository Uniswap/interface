import { HexString } from '@universe/encoding'
import { useMemo } from 'react'
import { useGetPoolsRewards } from 'uniswap/src/data/rest/getPoolsRewards'
import { LP_INCENTIVES_CHAIN_IDS, LP_INCENTIVES_DUST_THRESHOLD } from '~/features/Liquidity/LPIncentives/constants'
import { useEffectivelyClaimed } from '~/features/Liquidity/LPIncentives/hooks/useEffectivelyClaimed'

// Whether the connected wallet has claimable LP-incentive rewards above the dust threshold.
// Used to surface the rewards card to flag-off users who still have rewards to collect.
export function useLpIncentivesUserHasRewards(walletAddress?: HexString, hasCollectedRewards = false): boolean {
  const { data } = useGetPoolsRewards({ walletAddress, chainIds: LP_INCENTIVES_CHAIN_IDS }, Boolean(walletAddress))

  const effectivelyClaimed = useEffectivelyClaimed({
    tokenRewards: data?.totalUnclaimedAmountUni,
    hasCollectedRewards,
  })

  return useMemo(() => {
    if (effectivelyClaimed) {
      return false
    }
    try {
      return BigInt(data?.totalUnclaimedAmountUni ?? '0') >= LP_INCENTIVES_DUST_THRESHOLD
    } catch {
      return false
    }
  }, [data?.totalUnclaimedAmountUni, effectivelyClaimed])
}
