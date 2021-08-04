import { useMemo } from 'react'
import { BigNumber } from 'ethers'
import useHasClaimed from './useHasClaimed'
import { useClaimWhitelist } from '../../state/claim/hooks'

export default function useIsClaimAvailable(
  account: string | null | undefined
): { loading: boolean; available: boolean } {
  const whitelist = useClaimWhitelist()
  const { loading: loadingHasClaimed, claimed } = useHasClaimed(account)

  return useMemo(() => {
    if (loadingHasClaimed) return { loading: true, available: false }
    return {
      loading: false,
      available:
        !!whitelist.find(
          item => item.account.toLowerCase() === account?.toLowerCase() && !BigNumber.from(item.amount).isZero()
        ) && !claimed
    }
  }, [account, claimed, loadingHasClaimed, whitelist])
}
