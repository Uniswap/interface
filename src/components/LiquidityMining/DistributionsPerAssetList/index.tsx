import React from 'react'
import { useState } from 'react'
import { AutoRowCleanGap } from '../../Row'
import { Box, Flex } from 'rebass'
import Pagination from '../../Pagination'
import DistributionCard from './Distribution'
import { ParsedPerAssetData } from './index.d'
import LoadingList from '../LoadingList'

interface DistributionsPerAssetListProps {
  distributions: ParsedPerAssetData[] | null
}

export default function DistributionsPerAssetList({ distributions }: DistributionsPerAssetListProps) {
  const [page, setPage] = useState(0)

  // TODO: implement paginaton

  return (
    <Flex flexDirection="column">
      <Box mb="8px">
        <AutoRowCleanGap gap={6}>
          {!distributions ? (
            <LoadingList />
          ) : (
            <AutoRowCleanGap gap={4}>
              {distributions.map(distribution => (
                <DistributionCard
                  key={distribution.id}
                  token0={distribution.token0}
                  token1={distribution.token1}
                  usdRewards={distribution.usdRewards}
                />
              ))}
            </AutoRowCleanGap>
          )}
        </AutoRowCleanGap>
      </Box>
      {distributions && (
        <Flex width="100%" justifyContent="flex-end">
          <Box>
            <Pagination page={page} totalItems={distributions.length} itemsPerPage={12} onPageChange={setPage} />
          </Box>
        </Flex>
      )}
    </Flex>
  )
}
