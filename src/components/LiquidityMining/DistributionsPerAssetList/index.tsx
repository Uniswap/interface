import React from 'react'
import { useState } from 'react'
import { AutoRowCleanGap } from '../../Row'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Box, Flex } from 'rebass'
import Pagination from '../../Pagination'
import DistributionCard from './Distribution'
import { ParsedPerAssetData } from './index.d'

const UndecoratedLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`

interface DistributionsPerAssetListProps {
  distributions: ParsedPerAssetData[]
}

export default function DistributionsPerAssetList({ distributions }: DistributionsPerAssetListProps) {
  const [page, setPage] = useState(0)

  // TODO: implement paginaton

  return (
    <Flex flexDirection="column">
      <Box mb="8px">
        <AutoRowCleanGap gap={8}>
          {distributions.map(distribution => (
            <UndecoratedLink to={`/liquidity-mining/distribution/${distribution.id}`} key={distribution.id}>
              <DistributionCard
                token0={distribution.token0}
                token1={distribution.token1}
                usdRewards={distribution.usdRewards}
              />
            </UndecoratedLink>
          ))}
        </AutoRowCleanGap>
      </Box>
      <Flex width="100%" justifyContent="flex-end">
        <Box>
          <Pagination page={page} totalItems={distributions.length} itemsPerPage={12} onPageChange={setPage} />
        </Box>
      </Flex>
    </Flex>
  )
}
