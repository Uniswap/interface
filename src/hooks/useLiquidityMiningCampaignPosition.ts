import { LiquidityMiningCampaign, PricedToken, PricedTokenAmount, SingleSidedLiquidityMiningCampaign } from '@swapr/sdk'
import { useMemo } from 'react'
import { useStakingRewardsDistributionContract } from './useContract'
import { useSingleCallResult, useSingleContractMultipleData } from '../state/multicall/hooks'
import { useActiveWeb3React } from '.'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils'

interface UseLiquidityMiningCampaignUserPositionHookResult {
  stakedTokenAmount: PricedTokenAmount | null
  claimedRewardAmounts: PricedTokenAmount[]
  claimableRewardAmounts: PricedTokenAmount[]
  totalRewardedAmounts: PricedTokenAmount[]
}

export function useLiquidityMiningCampaignPosition(
  campaign?: LiquidityMiningCampaign | SingleSidedLiquidityMiningCampaign,
  account?: string
): UseLiquidityMiningCampaignUserPositionHookResult {
  const { chainId } = useActiveWeb3React()

  const distributionContract = useStakingRewardsDistributionContract(campaign?.address, true)

  const rewardIndexParams = useMemo(
    () => (campaign ? campaign.rewards.map((_: any, index: number) => [index]) : [undefined]),
    [campaign]
  )
  const accountParam = useMemo(() => [account], [account])

  const rewardsResults = useSingleContractMultipleData(distributionContract, 'rewards', rewardIndexParams)
  const claimedRewardsResult = useSingleCallResult(distributionContract, 'getClaimedRewards', accountParam)
  const stakedTokensOfResult = useSingleCallResult(distributionContract, 'stakedTokensOf', accountParam)
  const claimableRewardsResult = useSingleCallResult(distributionContract, 'claimableRewards', accountParam)

  return useMemo(() => {
    if (
      !campaign ||
      !chainId ||
      !claimableRewardsResult.result ||
      !stakedTokensOfResult.result ||
      !claimedRewardsResult.result ||
      !rewardsResults ||
      rewardsResults.length === 0 ||
      rewardsResults.some(result => !result.result)
    )
      return {
        stakedTokenAmount: null,
        claimedRewardAmounts: [],
        claimableRewardAmounts: [],
        totalRewardedAmounts: []
      }

    const rewardTokenAddresses = rewardsResults.map(wrappedResult => wrappedResult?.result?.[0])
    const stakedTokensOf = stakedTokensOfResult.result[0] as BigNumber
    const claimedRewards = claimedRewardsResult.result[0] as BigNumber[]
    const claimableRewards = claimableRewardsResult.result[0] as BigNumber[]

    const rewardTokens = campaign.rewards.reduce(
      (accumulator: { [address: string]: PricedToken }, reward: PricedTokenAmount) => {
        accumulator[getAddress(reward.token.address)] = reward.token
        return accumulator
      },
      {}
    )

    const claimedRewardAmounts = claimedRewards.map(
      (claimed, index) => new PricedTokenAmount(rewardTokens[rewardTokenAddresses[index]], claimed.toString())
    )
    const claimableRewardAmounts = claimableRewards.map(
      (claimable, index) => new PricedTokenAmount(rewardTokens[rewardTokenAddresses[index]], claimable.toString())
    )
    const totalRewardedAmounts = claimableRewardAmounts.map(
      (claimable, index) => new PricedTokenAmount(claimable.token, claimable.add(claimedRewardAmounts[index]).raw)
    )

    return {
      stakedTokenAmount: new PricedTokenAmount(campaign.staked.token, stakedTokensOf.toString()),
      claimedRewardAmounts,
      claimableRewardAmounts,
      totalRewardedAmounts
    }
  }, [
    campaign,
    chainId,
    claimableRewardsResult.result,
    claimedRewardsResult.result,
    rewardsResults,
    stakedTokensOfResult.result
  ])
}
