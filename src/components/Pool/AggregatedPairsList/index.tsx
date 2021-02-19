import React, { useMemo, useState } from 'react'
import AggregatedPairs from './AggregatedPairs'
import { Box, Flex, Text } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import ListFilter, { PairsFilterType } from '../ListFilter'
import { useAggregatedByToken0ExistingPairsWithRemainingRewards } from '../../../hooks/usePairData'
import Empty from '../Empty'
import MyPairs from './MyPairs'

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
          <Flex flexWrap="wrap" width="100%">
            <Box p="4px">
              <MyPairs pairs={userLpPairs} />
            </Box>
            {aggregatedData.map(aggregation => (
              <Box key={aggregation.token0.address} px="4px" py="6px">
                <AggregatedPairs
                  token={aggregation.token0}
                  usdRewards={aggregation.remainingRewardsUSD}
                  pairsNumber={aggregation.pairs.length}
                />
              </Box>
            ))}
          </Flex>
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
