import React, { useState } from 'react'
import AggregatedPairs from './AggregatedPairs'
import { Box, Flex, Text } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import ListFilter, { PairsFilterType, PairsSortingType } from '../ListFilter'
import { useAggregatedByToken0ExistingPairsWithRemainingRewards } from '../../../hooks/usePairData'
import styled from 'styled-components'

const EmptyListRoot = styled(Flex)`
  border: solid 1px ${props => props.theme.bg5};
  border-radius: 8px;
`

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
        ) : aggregatedData.length > 0 ? (
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
        ) : (
          <EmptyListRoot flexDirection="column" justifyContent="center" alignItems="center" width="100%" height="195px">
            <Box>
              <Text fontSize="12px" fontWeight="700" lineHeight="15px" letterSpacing="0.08em">
                NO PAIRS YET
              </Text>
            </Box>
          </EmptyListRoot>
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
