import React from 'react'
import { useState } from 'react'
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

  // TODO: implement pagination

  return (
    <Flex flexDirection="column">
      <Box mb="8px" height="460px">
        {!distributions ? (
          <LoadingList />
        ) : (
          <Flex flexWrap="wrap" m="-8px">
            {distributions.map(distribution => (
              <Box key={distribution.id} p="4px">
                <DistributionCard
                  key={distribution.id}
                  token0={distribution.token0}
                  token1={distribution.token1}
                  usdRewards={distribution.usdRewards}
                />
              </Box>
            ))}
          </Flex>
        )}
      </Box>
      <Flex width="100%" justifyContent="flex-end">
        <Box>
          <Pagination
            page={page}
            totalItems={distributions ? distributions.length : 0}
            itemsPerPage={12}
            onPageChange={setPage}
          />
        </Box>
      </Flex>
    </Flex>
  )
}
