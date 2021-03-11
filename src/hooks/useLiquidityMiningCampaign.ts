import { Token, TokenAmount } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useStakingRewardsDistributionContract } from './useContract'
import { useSingleCallResult } from '../state/multicall/hooks'
import { NonExpiredLiquidityMiningCampaignRewardToken } from '../apollo/queries'
import { useActiveWeb3React } from '.'
import BigNumber from 'bignumber.js'

interface UseLiquidityMiningCampaignUserPositionHookResult {
  stakedTokenAmount: TokenAmount | null
  claimedRewardAmounts: TokenAmount[]
  claimableRewardAmounts: TokenAmount[]
}

export function useLiquidityMiningCampaign(
  account?: string,
  stakableToken?: Token,
  campaignRewardTokens?: NonExpiredLiquidityMiningCampaignRewardToken[],
  distributionContractAddress?: string
): UseLiquidityMiningCampaignUserPositionHookResult {
  const { chainId } = useActiveWeb3React()
  const distributionContract = useStakingRewardsDistributionContract(distributionContractAddress, true)
  const claimedRewardsResult = useSingleCallResult(distributionContract, 'getClaimedRewards', [account])
  const stakedTokensOfResult = useSingleCallResult(distributionContract, 'stakedTokensOf', [account])
  const claimableRewardsResult = useSingleCallResult(distributionContract, 'claimableRewards', [account])
  const rewardTokens = useMemo(() => {
    if (!chainId || !campaignRewardTokens) return []
    return campaignRewardTokens.map(
      rawToken => new Token(chainId, rawToken.address, parseInt(rawToken.decimals), rawToken.symbol, rawToken.name)
    )
  }, [campaignRewardTokens, chainId])

  return useMemo(() => {
    if (
      !chainId ||
      rewardTokens.length === 0 ||
      !stakableToken ||
      !claimableRewardsResult.result ||
      !stakedTokensOfResult.result ||
      !claimedRewardsResult.result
    )
      return {
        stakedTokenAmount: null,
        claimedRewardAmounts: [],
        claimableRewardAmounts: []
      }
    const stakedTokensOf = stakedTokensOfResult.result[0] as BigNumber
    const claimedRewards = claimedRewardsResult.result[0] as BigNumber[]
    const claimableRewards = claimableRewardsResult.result[0] as BigNumber[]
    return {
      stakedTokenAmount: new TokenAmount(stakableToken, stakedTokensOf.toString()),
      claimedRewardAmounts: claimedRewards.map(
        (claimed, index) => new TokenAmount(rewardTokens[index], claimed.toString())
      ),
      claimableRewardAmounts: claimableRewards.map(
        (claimable, index) => new TokenAmount(rewardTokens[index], claimable.toString())
      )
    }
  }, [
    chainId,
    claimableRewardsResult.result,
    claimedRewardsResult.result,
    rewardTokens,
    stakableToken,
    stakedTokensOfResult.result
  ])
}
