import React, { useMemo, useState } from 'react'
import AggregatedPairs from './AggregatedPairs'
import { Box, Flex, Text } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import ListFilter, { PairsFilterType } from '../ListFilter'
import { useAggregatedByToken0ExistingPairsWithRemainingRewards } from '../../../hooks/usePairData'
import Empty from '../Empty'
import MyPairs from './MyPairs'
import styled from 'styled-components'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 9px;
  grid-template-columns: 155px 155px 155px 155px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: auto;
  `};
`

export default function AggregatedPairsList() {
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState(PairsFilterType.ALL)
  const { loading, aggregatedData } = useAggregatedByToken0ExistingPairsWithRemainingRewards(filter)

  const userLpPairs = useMemo(
    () =>
      aggregatedData
        .filter(aggregation => !aggregation.lpTokensBalance.isZero())
        .flatMap(aggregation => aggregation.pairs),
    [aggregatedData]
  )

  return (
    <Flex flexDirection="column">
      <Box mb="32px">
        <ListFilter disabled={loading} filter={filter} onFilterChange={setFilter} />
      </Box>
      <Box mb="8px" height="460px">
        {loading ? (
          <LoadingList />
        ) : aggregatedData.length > 0 ? (
          <ListLayout>
            <MyPairs pairs={userLpPairs} />
            {aggregatedData.map(aggregation => (
              <AggregatedPairs
                key={aggregation.token0.address}
                token={aggregation.token0}
                usdRewards={aggregation.remainingRewardsUSD}
                pairsNumber={aggregation.pairs.length}
                maximumApy={aggregation.maximumApy}
              />
            ))}
          </ListLayout>
        ) : (
          <Empty>
            <Text fontSize="12px" fontWeight="700" lineHeight="15px" letterSpacing="0.08em">
              NO PAIRS YET
            </Text>
          </Empty>
        )}
      </Box>
      <Flex width="100%" justifyContent="flex-end">
        <Box>
          <Pagination page={page} totalItems={aggregatedData.length} itemsPerPage={12} onPageChange={setPage} />
        </Box>
      </Flex>
    </Flex>
  )
}
