import React, { useState } from 'react'
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
      <Box mb="8px" height="460px">
        {!aggregatedDistributions ? (
          <LoadingList />
        ) : (
          <Flex wrap="wrap" m="-8px">
            {aggregatedDistributions.map(data => (
              <Box key={data.id} p="4px">
                <UndecoratedLink to={`/liquidity-mining/${data.id}`}>
                  <AggregatedDistributions token={data.relatedToken} usdRewards={data.usdRewards} />
                </UndecoratedLink>
              </Box>
            ))}
          </Flex>
        )}
      </Box>
      <Flex width="100%" justifyContent="flex-end">
        <Box>
          <Pagination
            page={page}
            totalItems={aggregatedDistributions ? aggregatedDistributions.length : 0}
            itemsPerPage={12}
            onPageChange={setPage}
          />
        </Box>
      </Flex>
    </Flex>
  )
}
