import { LiquidityMiningCampaign, Pair } from '@swapr/sdk'
import React, { useEffect, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import Pagination from '../../../../Pagination'
import Empty from '../../../Empty'
import LoadingList from '../../../LoadingList'
import { usePage } from '../../../../../hooks/usePage'
import { useWindowSize } from '../../../../../hooks/useWindowSize'
import { MEDIA_WIDTHS } from '../../../../../theme'
import PairCard from '../../../PairsList/Pair'
import { useNativeCurrencyUSDPrice } from '../../../../../hooks/useNativeCurrencyUSDPrice'
import { getStakedAmountUSD } from '../../../../../utils/liquidityMining'
import { UndecoratedLink } from '../../../../UndercoratedLink'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 210px 210px 210px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: auto;
    grid-gap: 10px;
  `};
`

interface LiquidityMiningCampaignsListProps {
  stakablePair?: Pair
  items?: { campaign: LiquidityMiningCampaign; staked: boolean; containsKpiToken: boolean }[]
  loading?: boolean
}

const { upToSmall, upToMedium } = MEDIA_WIDTHS

export default function List({ stakablePair, loading, items }: LiquidityMiningCampaignsListProps) {
  const [page, setPage] = useState(1)
  const [responsiveItemsPerPage, setResponsiveItemsPerPage] = useState(3)
  const itemsPage = usePage(items || [], responsiveItemsPerPage, page, 0)
  const { width } = useWindowSize()
  const { loading: loadingNativeCurrencyUsdPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()

  useEffect(() => {
    if (!width) return
    else if (width <= upToSmall) setResponsiveItemsPerPage(1)
    else if (width <= upToMedium) setResponsiveItemsPerPage(2)
    else setResponsiveItemsPerPage(3)
  }, [width])

  const overallLoading = loading || loadingNativeCurrencyUsdPrice || !items || !stakablePair

  return (
    <>
      <Flex flexDirection="column">
        <Box mb="8px" height="100px">
          {overallLoading ? (
            <LoadingList itemsAmount={responsiveItemsPerPage} />
          ) : itemsPage.length > 0 ? (
            <ListLayout>
              {itemsPage.map(item => {
                const token0 = stakablePair?.token0
                const token1 = stakablePair?.token1
                return (
                  <UndecoratedLink
                    key={item.campaign.address}
                    to={`/pools/${token0?.address}/${token1?.address}/${item.campaign.address}`}
                  >
                    <PairCard
                      token0={token0}
                      token1={token1}
                      usdLiquidity={getStakedAmountUSD(item.campaign, nativeCurrencyUSDPrice)}
                      apy={item.campaign.apy}
                      staked={item.staked}
                      containsKpiToken={item.containsKpiToken}
                      usdLiquidityText="STAKED"
                    />
                  </UndecoratedLink>
                )
              })}
            </ListLayout>
          ) : (
            <Empty>
              <Text fontSize="12px" fontWeight="700" lineHeight="15px" letterSpacing="0.08em">
                NO REWARD POOLS HERE YET
              </Text>
            </Empty>
          )}
        </Box>
        <Box alignSelf="flex-end" mt="16px">
          <Pagination
            page={page}
            totalItems={items?.length ?? 0}
            itemsPerPage={responsiveItemsPerPage}
            onPageChange={setPage}
          />
        </Box>
      </Flex>
    </>
  )
}
