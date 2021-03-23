import React, { useState } from 'react'
import AggregatedPairs from './AggregatedPairs'
import { Box, Flex, Text } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import ListFilter, { PairsFilterType } from '../ListFilter'
import Empty from '../Empty'
import MyPairs from './MyPairs'
import styled from 'styled-components'
import { usePage } from '../../../hooks/usePage'
import { CurrencyAmount, Pair, Percent, Token } from 'dxswap-sdk'
import { useResponsiveItemsPerPage } from '../../../hooks/useResponsiveItemsPerPage'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 15px 9px;
  grid-template-columns: 155px 155px 155px 155px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: auto auto auto;
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: auto auto;
  `};
`

interface AggregatedPairsListProps {
  loading: boolean
  aggregatedData: {
    token0: Token
    pairs: Pair[]
    remainingRewardsUSD: CurrencyAmount
    maximumApy: Percent
  }[]
  userLpPairs: Pair[]
  filter: PairsFilterType
  onFilterChange: (newFilter: PairsFilterType) => void
}

export default function AggregatedPairsList({
  loading,
  aggregatedData,
  userLpPairs,
  filter,
  onFilterChange
}: AggregatedPairsListProps) {
  const responsiveItemsAmount = useResponsiveItemsPerPage(false)
  const [page, setPage] = useState(1)
  const itemsPage = usePage(aggregatedData, responsiveItemsAmount, page, 1)
  console.log(itemsPage)

  return (
    <Flex flexDirection="column">
      <Box mb="32px">
        <ListFilter disabled={loading} filter={filter} onFilterChange={onFilterChange} />
      </Box>
      <Box mb="8px" minHeight={['230px', '460px']}>
        {loading ? (
          <LoadingList doubleCircle />
        ) : itemsPage.length > 0 ? (
          <ListLayout>
            {page === 1 && <MyPairs pairs={userLpPairs} />}
            {itemsPage.map(aggregation => (
              <AggregatedPairs
                key={aggregation.token0.address}
                token={aggregation.token0}
                usdRewards={aggregation.remainingRewardsUSD}
                pairsNumber={aggregation.pairs.length}
                maximumApy={aggregation.maximumApy}
              />
            ))}
          </ListLayout>
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
          <Pagination
            page={page}
            /* +1 because we account for the my pools card */
            totalItems={aggregatedData.length + 1}
            itemsPerPage={responsiveItemsAmount}
            onPageChange={setPage}
          />
        </Box>
      </Flex>
    </Flex>
  )
}
