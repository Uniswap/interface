import { useQuery } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { ChainId, Token } from 'dxswap-sdk'
import { useEffect, useState } from 'react'
import { GET_DISTRIBUTIONS_BY_AGGREGATION } from '../apollo/queries'
import {
  Distribution,
  ParsedPerAssetData,
  DistributionsPerAssetQueryResult,
  Reward
} from '../components/LiquidityMining/DistributionsPerAssetList/index.d'

export function useDistributionsFromAggregation(
  aggregationId: string
): { relatedToken: Token | null; distributions: ParsedPerAssetData[] | null } {
  const { chainId } = useWeb3React()

  const { loading, error, data: queryData } = useQuery<DistributionsPerAssetQueryResult>(
    GET_DISTRIBUTIONS_BY_AGGREGATION,
    {
      variables: {
        id: aggregationId
      }
    }
  )
  const [relatedToken, setRelatedToken] = useState<Token | null>(null)
  const [distributions, setDistributions] = useState<ParsedPerAssetData[] | null>(null)

  useEffect(() => {
    if (!queryData || loading || error) {
      return
    }
    const ethPrice = new BigNumber(queryData.bundles[0].ethPrice)
    const token0 = new Token(
      chainId || ChainId.MAINNET,
      queryData.aggregatedToken0DistributionData.token0.address,
      queryData.aggregatedToken0DistributionData.token0.decimals,
      queryData.aggregatedToken0DistributionData.token0.symbol
    )
    setRelatedToken(token0)
    const parsedDistributionsPerAsset = queryData.aggregatedToken0DistributionData.distributions.reduce(
      (accumulator: ParsedPerAssetData[], distribution: Distribution) => {
        const distributionRewardsEth = distribution.rewards.reduce(
          (rewardEth: BigNumber, reward: Reward) =>
            rewardEth.plus(new BigNumber(reward.amount).multipliedBy(reward.token.derivedETH)),
          new BigNumber(0)
        )
        const token1 = distribution.stakablePair.token1
        accumulator.push({
          id: distribution.id,
          token0,
          token1: new Token(chainId || ChainId.MAINNET, token1.address, token1.decimals, token1.symbol),
          usdRewards: distributionRewardsEth.multipliedBy(ethPrice)
        })
        return accumulator
      },
      []
    )
    setDistributions(parsedDistributionsPerAsset)
  }, [chainId, error, loading, queryData])

  return { distributions, relatedToken }
}
