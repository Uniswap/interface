import React from 'react'
import { useQuery } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { ChainId, Token } from 'dxswap-sdk'
import { useEffect, useState } from 'react'
import { GET_AGGREGATED_DISTRIBUTION_DATA } from '../../../apollo/queries'
import {
  AggregatedDistributionData,
  Reward,
  Distribution,
  AggregatedQueryResult,
  ParsedAggregationData
} from './index.d'
import { AutoRowCleanGap } from '../../Row'
import AggregatedDistributions from './AggregatedDistributions'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Box, Flex } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'

const UndecoratedLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`

export default function AggregatedDistributionList() {
  const { chainId } = useWeb3React()
  const [page, setPage] = useState(0)
  const { loading, error, data: rawAggregatedDistributionData } = useQuery<AggregatedQueryResult>(
    GET_AGGREGATED_DISTRIBUTION_DATA
  )
  const [aggregatedDistributionData, setAggregatedDistributionData] = useState<ParsedAggregationData[] | null>(null)

  // TODO: make this into a hook to clean up the component
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
    setAggregatedDistributionData(aggregatedDistributionData)
  }, [chainId, error, loading, rawAggregatedDistributionData])

  return (
    <Flex flexDirection="column">
      <Box mb="8px">
        {!aggregatedDistributionData ? (
          <LoadingList />
        ) : (
          <AutoRowCleanGap gap={4}>
            {aggregatedDistributionData.map(data => (
              <UndecoratedLink to={`/liquidity-mining/${data.id}`} key={data.id}>
                <AggregatedDistributions token={data.relatedToken} usdRewards={data.usdRewards} />
              </UndecoratedLink>
            ))}
          </AutoRowCleanGap>
        )}
      </Box>
      <Flex width="100%" justifyContent="flex-end">
        <Box>
          {aggregatedDistributionData && (
            <Pagination
              page={page}
              totalItems={aggregatedDistributionData.length}
              itemsPerPage={12}
              onPageChange={setPage}
            />
          )}
        </Box>
      </Flex>
    </Flex>
  )
}
