import React, { useState } from 'react'
import AggregatedPairs from './AggregatedPairs'
import { Box, Flex } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import { useAggregatedByToken0ExistingPairs } from '../../../data/Reserves'
import BigNumber from 'bignumber.js'
import { UndecoratedLink } from '../../UndercoratedLink'

export default function AggregatedPairsList() {
  const [page, setPage] = useState(0)
  const { loading, aggregatedData } = useAggregatedByToken0ExistingPairs()

  return (
    <Flex flexDirection="column">
      <Box mb="8px" height="460px">
        {loading ? (
          <LoadingList />
        ) : (
          <Flex wrap="wrap" m="-8px">
            {aggregatedData.map(aggregation => (
              <Box key={aggregation.token0.address} p="4px">
                <UndecoratedLink to={`/pools/${aggregation.token0.address}`}>
                  <AggregatedPairs
                    token={aggregation.token0}
                    usdRewards={new BigNumber(0)}
                    pairsNumber={aggregation.pairsNumber}
                  />
                </UndecoratedLink>
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
