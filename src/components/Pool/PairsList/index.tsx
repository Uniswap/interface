import React, { useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import Pagination from '../../Pagination'
import LoadingList from '../LoadingList'
import { UndecoratedLink } from '../../UndercoratedLink'
import PairCard from './Pair'
import { Pair } from 'dxswap-sdk'
import Empty from '../Empty'
import styled from 'styled-components'
import { usePage } from '../../../hooks/usePage'
import { getPairMaximumApy, getPairRemainingRewardsUSD } from '../../../utils/liquidityMining'
import { useNativeCurrencyUSDPrice } from '../../../hooks/useNativeCurrencyUSDPrice'
import { useResponsiveItemsPerPage } from '../../../hooks/useResponsiveItemsPerPage'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 15px 9px;
  grid-template-columns: 208px 208px 208px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: auto auto;
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: auto;
  `};
`

interface PairsListProps {
  pairs: Pair[]
  loading?: boolean
}

export default function PairsList({ pairs, loading }: PairsListProps) {
  const [page, setPage] = useState(1)
  const responsiveItemsPerPgae = useResponsiveItemsPerPage(true)
  const itemsPage = usePage(pairs, responsiveItemsPerPgae, page, 0)
  const { loading: loadingNativeCurrencyUSDPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()

  const overallLoading = loading || loadingNativeCurrencyUSDPrice

  return (
    <Flex flexDirection="column">
      <Box mb="8px" height="460px">
        {overallLoading ? (
          <LoadingList wideCards doubleCircle />
        ) : itemsPage.length > 0 ? (
          <ListLayout>
            {itemsPage.map(pair => {
              const remainingRewardUSD = getPairRemainingRewardsUSD(pair, nativeCurrencyUSDPrice)
              const maximumApy = getPairMaximumApy(pair)
              return (
                <UndecoratedLink
                  key={pair.liquidityToken.address}
                  to={`/pools/${pair.token0.address}/${pair.token1.address}`}
                >
                  <PairCard
                    token0={pair.token0}
                    token1={pair.token1}
                    usdRewards={remainingRewardUSD}
                    apy={maximumApy}
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
      <Flex width="100%" justifyContent="flex-end">
        <Box>
          <Pagination page={page} totalItems={pairs.length} itemsPerPage={12} onPageChange={setPage} />
        </Box>
      </Flex>
    </Flex>
  )
}
