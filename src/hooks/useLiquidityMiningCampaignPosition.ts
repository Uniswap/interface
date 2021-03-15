import { LiquidityMiningCampaign, PricedTokenAmount } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useStakingRewardsDistributionContract } from './useContract'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useActiveWeb3React } from '.'
import { BigNumber } from 'ethers'

interface UseLiquidityMiningCampaignUserPositionHookResult {
  stakedTokenAmount: PricedTokenAmount | null
  claimedRewardAmounts: PricedTokenAmount[]
  claimableRewardAmounts: PricedTokenAmount[]
}

export function useLiquidityMiningCampaignPosition(
  campaign: LiquidityMiningCampaign,
  account?: string
): UseLiquidityMiningCampaignUserPositionHookResult {
  const { chainId } = useActiveWeb3React()
  const distributionContract = useStakingRewardsDistributionContract(campaign.address, true)
  const claimedRewardsResult = useSingleCallResult(distributionContract, 'getClaimedRewards', [account])
  const stakedTokensOfResult = useSingleCallResult(distributionContract, 'stakedTokensOf', [account])
  const claimableRewardsResult = useSingleCallResult(distributionContract, 'claimableRewards', [account])

  return useMemo(() => {
    if (!chainId || !claimableRewardsResult.result || !stakedTokensOfResult.result || !claimedRewardsResult.result)
      return {
        stakedTokenAmount: null,
        claimedRewardAmounts: [],
        claimableRewardAmounts: []
      }
    const stakedTokensOf = stakedTokensOfResult.result[0] as BigNumber
    const claimedRewards = claimedRewardsResult.result[0] as BigNumber[]
    const claimableRewards = claimableRewardsResult.result[0] as BigNumber[]
    return {
      stakedTokenAmount: new PricedTokenAmount(campaign.staked.token, stakedTokensOf.toString()),
      claimedRewardAmounts: claimedRewards.map(
        (claimed, index) => new PricedTokenAmount(campaign.rewards[index].token, claimed.toString())
      ),
      claimableRewardAmounts: claimableRewards.map(
        (claimable, index) => new PricedTokenAmount(campaign.rewards[index].token, claimable.toString())
      )
    }
  }, [
    campaign.rewards,
    campaign.staked.token,
    chainId,
    claimableRewardsResult.result,
    claimedRewardsResult.result,
    stakedTokensOfResult.result
  ])
}
