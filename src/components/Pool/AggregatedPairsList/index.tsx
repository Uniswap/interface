import React, { useState } from 'react'
import AggregatedPairs from './AggregatedPairs'
import { Box, Flex } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import ListFilter, { PairsFilterType, PairsSortingType } from '../ListFilter'
import { useAggregatedByToken0ExistingPairsWithRemainingRewards } from '../../../hooks/usePairData'

export default function AggregatedPairsList() {
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState(PairsFilterType.ALL)
  const [sorting] = useState(PairsSortingType.RELEVANCE)
  const { loading, aggregatedData } = useAggregatedByToken0ExistingPairsWithRemainingRewards()

  return (
    <Flex flexDirection="column">
      <Box mb="32px">
        <ListFilter
          disabled={loading}
          filter={filter}
          sorting={sorting}
          onFilterChange={setFilter}
          onSortingChange={() => {}}
        />
      </Box>
      <Box mb="8px" height="460px">
        {loading ? (
          <LoadingList />
        ) : (
          <Flex wrap="wrap" m="-4px">
            {aggregatedData.map(aggregation => (
              <Box key={aggregation.token0.address} p="4px">
                <AggregatedPairs
                  token={aggregation.token0}
                  usdRewards={aggregation.remainingRewardsUSD}
                  pairsNumber={aggregation.pairs.length}
                />
              </Box>
            ))}
          </Flex>
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
