import { useMemo } from 'react'
import { useSingleCallResult } from '../../state/multicall/hooks'
import { useSWPRClaimerContract } from '../useContract'

export default function useHasClaimed(account: string | null | undefined): { loading: boolean; claimed: boolean } {
  const swprClaimerContract = useSWPRClaimerContract()
  const result = useSingleCallResult(swprClaimerContract, 'claimed', account ? [account] : [])

  return useMemo(() => {
    if (!account || !swprClaimerContract) return { loading: false, claimed: false }
    if (result.loading || result.error) return { loading: true, claimed: false }
    return { loading: false, claimed: result.result?.[0] }
  }, [account, result, swprClaimerContract])
}
