import { LiquidityMiningCampaign } from '@swapr/sdk'
import { useMemo } from 'react'
import { useStakingRewardsDistributionFactoryContract } from './useContract'
import { TransactionResponse } from '@ethersproject/providers'
import { parseUnits } from 'ethers/lib/utils'

/**
 * Returns a function that creates a liquidity mining distribution with the given parameters.
 */
export function useCreateLiquidityMiningCallback(
  campaign: LiquidityMiningCampaign | null
): null | (() => Promise<TransactionResponse>) {
  const factoryContract = useStakingRewardsDistributionFactoryContract(true)

  return useMemo(() => {
    if (!factoryContract || !campaign) return null
    return async () => {
      return factoryContract.createDistribution(
        campaign.rewards.map(reward => reward.token.address),
        campaign.targetedPair.liquidityToken.address,
        campaign.rewards.map(reward => parseUnits(reward?.toExact(), reward.token.decimals).toString()),
        campaign.startsAt,
        campaign.endsAt,
        campaign.locked,
        campaign.stakingCap.raw.toString()
      )
    }
  }, [factoryContract, campaign])
}
