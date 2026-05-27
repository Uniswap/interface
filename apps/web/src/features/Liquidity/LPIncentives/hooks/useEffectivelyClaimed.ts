import { useAtom } from 'jotai'
import { useEffect, useMemo } from 'react'
import { lpIncentivesLastClaimedAtom } from '~/features/Liquidity/hooks/useLpIncentives'
import { LP_INCENTIVES_CLAIM_STALENESS_MS } from '~/features/Liquidity/LPIncentives/constants'

interface UseEffectivelyClaimedArgs {
  tokenRewards: string | undefined
  hasCollectedRewards: boolean
}

// Whether the user's LP-incentive rewards should be treated as already claimed for UI purposes.
// Returns true when either:
//   - the in-session `hasCollectedRewards` flag from `useLpIncentives` is set, OR
//   - `lpIncentivesLastClaimedAtom` (localStorage-backed) holds a matching, recent (< 5 min) entry —
//     covers the lag between an on-chain claim and Merkl's API reflecting the zero balance.
// Also clears the atom when its entry is past the staleness window, keeping localStorage tidy.
export function useEffectivelyClaimed({ tokenRewards, hasCollectedRewards }: UseEffectivelyClaimedArgs): boolean {
  const [lastClaimed, setLastClaimed] = useAtom(lpIncentivesLastClaimedAtom)

  useEffect(() => {
    if (lastClaimed && Date.now() - lastClaimed.timestamp > LP_INCENTIVES_CLAIM_STALENESS_MS) {
      setLastClaimed(null)
    }
  }, [lastClaimed, setLastClaimed])

  return useMemo(() => {
    if (hasCollectedRewards) {
      return true
    }
    if (!lastClaimed || !tokenRewards) {
      return false
    }
    return Date.now() - lastClaimed.timestamp < LP_INCENTIVES_CLAIM_STALENESS_MS && tokenRewards === lastClaimed.amount
  }, [hasCollectedRewards, lastClaimed, tokenRewards])
}
