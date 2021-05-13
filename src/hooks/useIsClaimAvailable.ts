import { useSingleCallResult } from '../state/multicall/hooks'
import { useActiveWeb3React } from './index'
import { useMemo } from 'react'
import { ChainId, SWPR_CLAIMER_ADDRESS } from 'dxswap-sdk'
import { ZERO_ADDRESS } from '../constants'
import { useSWPRClaimerContract } from './useContract'
import { useClaimWhitelist } from '../state/claim/hooks'
import { BigNumber } from 'ethers'

export default function useIsClaimAvailable(
  account: string | null | undefined
): { loading: boolean; available: boolean } {
  const { chainId } = useActiveWeb3React()
  const whitelist = useClaimWhitelist()
  const swprClaimerContract = useSWPRClaimerContract(SWPR_CLAIMER_ADDRESS[chainId || ChainId.MAINNET])
  const alreadyClaimedResult = useSingleCallResult(swprClaimerContract, 'claimed', [account || undefined])

  return useMemo(() => {
    if (!chainId) return { loading: false, available: false }
    if (SWPR_CLAIMER_ADDRESS[chainId] === ZERO_ADDRESS || alreadyClaimedResult.error)
      return { loading: false, available: false }
    if (alreadyClaimedResult.loading) return { loading: true, available: false }
    return {
      loading: false,
      available:
        !!whitelist.find(
          item => item.account.toLowerCase() === account?.toLowerCase() && !BigNumber.from(item.amount).isZero()
        ) &&
        !!alreadyClaimedResult.result &&
        alreadyClaimedResult.result.length > 0 &&
        !alreadyClaimedResult.result[0]
    }
  }, [account, alreadyClaimedResult, chainId, whitelist])
}
