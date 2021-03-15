import React, { memo, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import { usePairsByToken0WithRemainingRewardUSDAndMaximumApy } from '../../../data/Reserves'
import { UndecoratedLink } from '../../UndercoratedLink'
import Pair from './Pair'
import { Token } from 'dxswap-sdk'
import Empty from '../Empty'
import styled from 'styled-components'
import { usePage } from '../../../hooks/usePage'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 15px 9px;
  grid-template-columns: 208px 208px 208px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: auto;
  `};
`

interface AggregatedPairsListProps {
  token0?: Token | null
}

const ITEMS_PER_PAGE = 9

function Token0PairsList({ token0 }: AggregatedPairsListProps) {
  const [page, setPage] = useState(1)
  const { loading, wrappedPairs } = usePairsByToken0WithRemainingRewardUSDAndMaximumApy(token0)
  const itemsPage = usePage(wrappedPairs, ITEMS_PER_PAGE, page, 0)

  return (
    <Flex flexDirection="column">
      <Box mb="8px" height="460px">
        {loading ? (
          <LoadingList wideCards doubleCircle />
        ) : itemsPage.length > 0 ? (
          <ListLayout>
            {itemsPage.map(wrappedPair => {
              const { pair, remainingRewardUSD, maximumApy } = wrappedPair
              return (
                <UndecoratedLink
                  key={pair.liquidityToken.address}
                  to={`/pools/${pair.token0.address}/${pair.token1.address}`}
                >
                  <Pair token0={pair.token0} token1={pair.token1} usdRewards={remainingRewardUSD} apy={maximumApy} />
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
      <Flex width="100%" justifyContent="flex-end">
        <Box>
          <Pagination page={page} totalItems={wrappedPairs.length} itemsPerPage={12} onPageChange={setPage} />
        </Box>
      </Flex>
    </Flex>
  )
}

export default memo(Token0PairsList, (previousProps, nextProps) => {
  // avoids token reference changes to mess things up by reloading the whole thing
  return !!(previousProps.token0 && nextProps.token0 && previousProps.token0.equals(nextProps.token0))
})
