import React, { useState } from 'react'
import { Box, Flex } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import { usePairsByToken0 } from '../../../data/Reserves'
import { UndecoratedLink } from '../../UndercoratedLink'
import Pair from './Pair'
import { Token } from 'dxswap-sdk'

interface AggregatedPairsListProps {
  token0?: Token | null
}

export default function Token0PairsList({ token0 }: AggregatedPairsListProps) {
  const [page, setPage] = useState(0)
  const { loading, pairs } = usePairsByToken0(token0)

  return (
    <Flex flexDirection="column">
      <Box mb="8px" height="460px">
        {loading ? (
          <LoadingList wideCards />
        ) : (
          <Flex wrap="wrap" m="-4px">
            {pairs.map(pair => (
              <Box key={pair.token0.address} p="4px">
                <UndecoratedLink to={`/pools/${pair.token0.address}/${pair.token1.address}`}>
                  <Pair token0={pair.token0} token1={pair.token1} />
                </UndecoratedLink>
              </Box>
            ))}
          </Flex>
        )}
      </Box>
      <Flex width="100%" justifyContent="flex-end">
        <Box>
          <Pagination page={page} totalItems={pairs.length} itemsPerPage={12} onPageChange={setPage} />
        </Box>
      </Flex>
    </Flex>
  )
}
