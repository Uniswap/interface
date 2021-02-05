import { useQuery } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { ChainId, Token } from 'dxswap-sdk'
import { useEffect, useState } from 'react'
import { GET_AGGREGATED_DISTRIBUTION_DATA } from '../apollo/queries'
import {
  AggregatedDistributionData,
  AggregatedQueryResult,
  Distribution,
  ParsedAggregationData,
  Reward
} from '../components/LiquidityMining/AggregatedDistributionsList/index.d'

export function useAggregatedDistributions(): ParsedAggregationData[] | null {
  const { chainId } = useWeb3React()
  const { loading, error, data: rawAggregatedDistributionData } = useQuery<AggregatedQueryResult>(
    GET_AGGREGATED_DISTRIBUTION_DATA
  )
  const [aggregatedDistributions, setAggregatedDistributions] = useState<ParsedAggregationData[] | null>(null)

  useEffect(() => {
    if (!rawAggregatedDistributionData || loading || error) {
      return
    }
    const ethPrice = new BigNumber(rawAggregatedDistributionData.bundles[0].ethPrice)
    const aggregatedDistributionData = rawAggregatedDistributionData.aggregatedToken0DistributionDatas.reduce(
      (accumulator: any, data: AggregatedDistributionData) => {
        const totalRewardsEth = data.distributions.reduce((accumulator: BigNumber, distribution: Distribution) => {
          const distributionRewardsEth = distribution.rewards.reduce(
            (rewardEth: BigNumber, reward: Reward) => rewardEth.plus(new BigNumber(reward.amount)),
            new BigNumber(0)
          )
          return accumulator.plus(distributionRewardsEth)
        }, new BigNumber(0))
        const token = data.token0
        accumulator.push({
          id: data.id,
          relatedToken: new Token(chainId || ChainId.MAINNET, token.address, token.decimals, token.symbol),
          usdRewards: totalRewardsEth.multipliedBy(ethPrice)
        })
        return accumulator
      },
      []
    )
    setAggregatedDistributions(aggregatedDistributionData)
  }, [chainId, error, loading, rawAggregatedDistributionData])

  return aggregatedDistributions
}
