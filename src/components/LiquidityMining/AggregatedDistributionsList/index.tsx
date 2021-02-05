import React, { useState } from 'react'
import { AutoRowCleanGap } from '../../Row'
import AggregatedDistributions from './AggregatedDistributions'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Box, Flex } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import { useAggregatedDistributions } from '../../../hooks/useAggregatedDistributions'

const UndecoratedLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`

export default function AggregatedDistributionList() {
  const [page, setPage] = useState(0)
  const aggregatedDistributions = useAggregatedDistributions()

  return (
    <Flex flexDirection="column">
      <Box mb="8px">
        {!aggregatedDistributions ? (
          <LoadingList />
        ) : (
          <AutoRowCleanGap gap={8}>
            {aggregatedDistributions.map(data => (
              <UndecoratedLink to={`/liquidity-mining/${data.id}`} key={data.id}>
                <AggregatedDistributions token={data.relatedToken} usdRewards={data.usdRewards} />
              </UndecoratedLink>
            ))}
          </AutoRowCleanGap>
        )}
      </Box>
      <Flex width="100%" justifyContent="flex-end">
        <Box>
          {aggregatedDistributions && (
            <Pagination
              page={page}
              totalItems={aggregatedDistributions.length}
              itemsPerPage={12}
              onPageChange={setPage}
            />
          )}
        </Box>
      </Flex>
    </Flex>
  )
}
