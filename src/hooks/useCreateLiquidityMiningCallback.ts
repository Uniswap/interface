import { Pair, TokenAmount } from 'dxswap-sdk'
import { useMemo } from 'react'
import { useStakingRewardsDistributionFactoryContract } from './useContract'
import { TransactionResponse } from '@ethersproject/providers'
import { parseUnits } from 'ethers/lib/utils'

/**
 * Returns a function that creates a liquidity mining distribution with the given parameters.
 */
export function useCreateLiquidityMiningCallback(
  liquidityPair: Pair | null,
  rewards: (TokenAmount | null)[],
  startTime: Date | null,
  endTime: Date | null,
  timelocked: boolean
): null | (() => Promise<TransactionResponse>) {
  const factoryContract = useStakingRewardsDistributionFactoryContract(true)

  return useMemo(() => {
    if (
      !factoryContract ||
      !liquidityPair ||
      !rewards ||
      rewards.length === 0 ||
      !!rewards.find(reward => !reward) ||
      !startTime ||
      !endTime
    ) {
      return null
    }
    return async () => {
      return factoryContract.createDistribution(
        (rewards as TokenAmount[]).map(reward => reward.token.address),
        liquidityPair.liquidityToken.address,
        (rewards as TokenAmount[]).map(reward => parseUnits(reward?.toExact(), reward.token.decimals).toString()),
        Math.floor(startTime.getTime() / 1000),
        Math.floor(endTime.getTime() / 1000),
        timelocked
      )
    }
  }, [factoryContract, liquidityPair, rewards, startTime, endTime, timelocked])
}
