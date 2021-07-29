import { useSingleCallResult } from '../state/multicall/hooks'
import { useActiveWeb3React } from './index'
import { useMemo } from 'react'
import { ChainId, SWPR, SWPR_CLAIMER_ADDRESS, TokenAmount } from 'dxswap-sdk'
import { ZERO_ADDRESS } from '../constants'
import { useSWPRClaimerContract } from './useContract'
import { useClaimWhitelist } from '../state/claim/hooks'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils'

export default function useUnclaimedSWPRBalance(
  account: string | null | undefined
): { loading: boolean; unclaimedBalance: TokenAmount | null } {
  const { chainId } = useActiveWeb3React()
  const swpr = SWPR[chainId || ChainId.MAINNET]
  const whitelist = useClaimWhitelist()
  const swprClaimerContract = useSWPRClaimerContract(SWPR_CLAIMER_ADDRESS[chainId || ChainId.MAINNET])
  const alreadyClaimedResult = useSingleCallResult(swprClaimerContract, 'claimed', [account || undefined])

  return useMemo(() => {
    if (!chainId || !swpr || swpr.address === ZERO_ADDRESS || alreadyClaimedResult.error || !account)
      return { loading: false, unclaimedBalance: null }
    if (alreadyClaimedResult.loading) return { loading: true, unclaimedBalance: new TokenAmount(swpr, '0') }
    const whitelistEntry = whitelist.find(
      item => getAddress(item.account) === getAddress(account) && !BigNumber.from(item.amount).isZero()
    )
    if (!whitelistEntry) return { loading: false, unclaimedBalance: new TokenAmount(swpr, '0') }
    if (alreadyClaimedResult.result && alreadyClaimedResult.result.length > 0 && alreadyClaimedResult.result[0])
      return { loading: false, unclaimedBalance: new TokenAmount(swpr, '0') }
    return {
      loading: false,
      unclaimedBalance: new TokenAmount(swpr, whitelistEntry.amount)
    }
  }, [
    account,
    alreadyClaimedResult.error,
    alreadyClaimedResult.loading,
    alreadyClaimedResult.result,
    chainId,
    swpr,
    whitelist
  ])
}
