import { Token, TokenAmount } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useStakingRewardsDistributionContract } from './useContract'
import { useSingleCallResult } from '../state/multicall/hooks'
import { BigNumber } from 'ethers'

export function useLiquidityMiningDistributionStakedBalance(
  account?: string,
  stakableToken?: Token,
  distributionContractAddress?: string
): TokenAmount | null {
  const distributionContract = useStakingRewardsDistributionContract(distributionContractAddress, true)
  const result = useSingleCallResult(distributionContract, 'stakedTokensOf', [account])

  return useMemo(() => {
    if (!stakableToken || !result || !result.result) return null
    return new TokenAmount(stakableToken, (result.result[0] as BigNumber).toString())
  }, [result, stakableToken])
}
