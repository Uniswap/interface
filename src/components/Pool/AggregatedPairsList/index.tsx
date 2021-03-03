import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AggregatedPairs from './AggregatedPairs'
import { Box, Flex, Text } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import ListFilter, { PairsFilterType } from '../ListFilter'
import { useAggregatedByToken0ExistingPairsWithRemainingRewardsAndMaximumApy } from '../../../hooks/usePairData'
import Empty from '../Empty'
import MyPairs from './MyPairs'
import styled from 'styled-components'
import { Pair, Token, TokenAmount } from 'dxswap-sdk'
import BigNumber from 'bignumber.js'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 9px;
  grid-template-columns: 155px 155px 155px 155px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: auto;
  `};
`

const ITEMS_PER_PAGE = 12

export default function AggregatedPairsList() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState(PairsFilterType.ALL)
  const { loading, aggregatedData } = useAggregatedByToken0ExistingPairsWithRemainingRewardsAndMaximumApy(filter)
  const [paginatedItems, setPaginatedItems] = useState<
    {
      token0: Token
      lpTokensBalance: TokenAmount
      pairs: Pair[]
      remainingRewardsUSD: BigNumber
      maximumApy: BigNumber
    }[]
  >([])

  const userLpPairs = useMemo(
    () =>
      aggregatedData
        .filter(aggregation => aggregation.lpTokensBalance.greaterThan('0'))
        .flatMap(aggregation => aggregation.pairs),
    [aggregatedData]
  )

  // populate the first paginated page after loading. The first page contains
  // only 11 items because the my pools card is always there
  useEffect(() => {
    if (!loading && aggregatedData.length > 0 && paginatedItems.length === 0) {
      setPaginatedItems(aggregatedData.slice(0, ITEMS_PER_PAGE - 1))
    }
  }, [aggregatedData, loading, paginatedItems.length])

  const handlePageChange = useCallback(
    page => {
      setPage(page)
      const zeroIndexPage = page - 1
      const normalizedItemsPerPage = zeroIndexPage < 2 ? ITEMS_PER_PAGE - 1 : ITEMS_PER_PAGE
      const offset = zeroIndexPage * normalizedItemsPerPage
      setPaginatedItems(aggregatedData.slice(offset, offset + normalizedItemsPerPage))
    },
    [aggregatedData]
  )

  return (
    <Flex flexDirection="column">
      <Box mb="32px">
        <ListFilter disabled={loading} filter={filter} onFilterChange={setFilter} />
      </Box>
      <Box mb="8px" height="460px">
        {loading ? (
          <LoadingList />
        ) : paginatedItems.length > 0 ? (
          <ListLayout>
            {page === 1 && <MyPairs pairs={userLpPairs} />}
            {paginatedItems.map(aggregation => (
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
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </Box>
      </Flex>
    </Flex>
  )
}
