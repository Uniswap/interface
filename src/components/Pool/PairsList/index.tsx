import React, { useEffect, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import { UndecoratedLink } from '../../UndercoratedLink'
import PairCard from './Pair'
import { CurrencyAmount, Pair, Percent } from 'dxswap-sdk'
import Empty from '../Empty'
import styled from 'styled-components'
import { usePage } from '../../../hooks/usePage'
import { useResponsiveItemsPerPage } from '../../../hooks/useResponsiveItemsPerPage'
import { useActiveWeb3React } from '../../../hooks'
import { PairsFilterType } from '../ListFilter'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 12px 10px;
  grid-template-columns: 210px 210px 210px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr;
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: auto;
    grid-gap: 8px;
  `};
`

const PaginationRow = styled(Flex)`
  width: 100%;
  justify-content: flex-end;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    justify-content: center;
  `};

  & ul {
    margin: 22px 0;
  }
`;

interface PairsListProps {
  aggregatedPairs: {
    pair: Pair
    liquidityUSD: CurrencyAmount
    maximumApy: Percent
    staked?: boolean
  }[]
  filter?: PairsFilterType
  loading?: boolean
}

export default function PairsList({ aggregatedPairs, loading, filter }: PairsListProps) {
  const { chainId } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const responsiveItemsPerPage = useResponsiveItemsPerPage()
  const itemsPage = usePage(aggregatedPairs, responsiveItemsPerPage, page, 0)
  
  useEffect(() => {
    // reset page when connected chain or selected filter changes
    setPage(1)
  }, [chainId, filter, aggregatedPairs])
  
  return (
    <Flex flexDirection="column">
      <Box>
        {loading ? (
          <LoadingList />
        ) : itemsPage.length > 0 ? (
          <ListLayout>
            {itemsPage.map(aggregatedPair => {
              return (
                <UndecoratedLink
                  key={aggregatedPair.pair.liquidityToken.address}
                  to={`/pools/${aggregatedPair.pair.token0.address}/${aggregatedPair.pair.token1.address}`}
                >
                  <PairCard
                    token0={aggregatedPair.pair.token0}
                    token1={aggregatedPair.pair.token1}
                    usdLiquidity={aggregatedPair.liquidityUSD}
                    apy={aggregatedPair.maximumApy}
                    staked={aggregatedPair.staked}
                  />
                </UndecoratedLink>
              )
            })}
          </ListLayout>
        ) : (
          <Empty>
            <Text fontSize="12px" fontWeight="700" lineHeight="15px" letterSpacing="0.08em">
              NO PAIRS YET
            </Text>
          </Empty>
        )}
      </Box>
      {aggregatedPairs.length > responsiveItemsPerPage && (
        <PaginationRow>
          <Box>
            <Pagination
              page={page}
              totalItems={aggregatedPairs.length + 1}
              itemsPerPage={responsiveItemsPerPage}
              onPageChange={setPage}
            />
          </Box>
        </PaginationRow>
      )}
    </Flex>
  )
}
