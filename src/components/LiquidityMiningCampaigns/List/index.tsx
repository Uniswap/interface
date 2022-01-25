import { LiquidityMiningCampaign, SingleSidedLiquidityMiningCampaign } from '@swapr/sdk'
import React, { useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { Pagination } from '../../Pagination'

import { Empty } from '../../Pool/Empty'
import { LoadingList } from '../../Pool/LoadingList'
import { usePage } from '../../../hooks/usePage'
import { useWindowSize } from '../../../hooks/useWindowSize'
import { MEDIA_WIDTHS } from '../../../theme'

import { useNativeCurrencyUSDPrice } from '../../../hooks/useNativeCurrencyUSDPrice'
import { getStakedAmountUSD } from '../../../utils/liquidityMining'
import { UndecoratedLink } from '../../UndercoratedLink'
import { CampaignCard } from '../../Pool/PairsList/CampaignCard'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 12px 10px;
  grid-template-columns: 1fr 1fr 1fr;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr;
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: auto;
    grid-gap: 8px;
  `};
`

interface LiquidityMiningCampaignsListProps {
  items?: {
    campaign: LiquidityMiningCampaign | SingleSidedLiquidityMiningCampaign
    staked: boolean
    containsKpiToken: boolean
  }[]
  loading?: boolean
}

const { upToMedium, upToExtraSmall } = MEDIA_WIDTHS

export default function List({ loading, items = [] }: LiquidityMiningCampaignsListProps) {
  const { width } = useWindowSize()
  const [page, setPage] = useState(1)
  const prevItemsCt = useRef(items.length)
  const [responsiveItemsPerPage, setResponsiveItemsPerPage] = useState(9)
  const itemsPage = usePage(items, responsiveItemsPerPage, page, 0)
  const { loading: loadingNativeCurrencyUsdPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()

  useEffect(() => {
    if (!width) return

    let itemsPerPage = 9

    if (width <= upToExtraSmall) {
      itemsPerPage = 1
    } else if (width <= upToMedium) {
      itemsPerPage = 6
    }

    setResponsiveItemsPerPage(itemsPerPage)
  }, [width])

  useEffect(() => {
    if (items.length !== prevItemsCt.current) {
      setPage(1)
    }
  }, [items.length])

  const overallLoading = loading || loadingNativeCurrencyUsdPrice || !items

  return (
    <>
      <Flex flexDirection="column">
        <Box mb="8px">
          {overallLoading ? (
            <LoadingList isMobile={true} itemsAmount={responsiveItemsPerPage} />
          ) : itemsPage.length > 0 ? (
            <ListLayout>
              {itemsPage.map(item => {
                if (item.campaign instanceof SingleSidedLiquidityMiningCampaign) {
                  return (
                    <UndecoratedLink
                      key={item.campaign.address}
                      to={`/rewards/${item.campaign.stakeToken.address}/${item.campaign.address}/singleSidedStaking`}
                    >
                      <CampaignCard
                        token0={item.campaign.stakeToken}
                        usdLiquidity={getStakedAmountUSD(
                          item.campaign.staked.nativeCurrencyAmount,
                          nativeCurrencyUSDPrice
                        )}
                        apy={item.campaign.apy}
                        isSingleSidedStakingCampaign={true}
                        usdLiquidityText={item.campaign.locked ? 'LOCKED' : 'STAKED'}
                        staked={item.staked}
                        campaign={item.campaign}
                      />
                    </UndecoratedLink>
                  )
                } else {
                  const token0 = item.campaign?.targetedPair.token0
                  const token1 = item.campaign?.targetedPair.token1

                  return (
                    <UndecoratedLink
                      key={item.campaign.address}
                      to={`/rewards/${token0?.address}/${token1?.address}/${item.campaign.address}`}
                    >
                      <CampaignCard
                        token0={token0}
                        token1={token1}
                        usdLiquidity={getStakedAmountUSD(
                          item.campaign.staked.nativeCurrencyAmount,
                          nativeCurrencyUSDPrice
                        )}
                        apy={item.campaign.apy}
                        containsKpiToken={item.containsKpiToken}
                        usdLiquidityText={item.campaign.locked ? 'LOCKED' : 'STAKED'}
                        staked={item.staked}
                        campaign={item.campaign}
                      />
                    </UndecoratedLink>
                  )
                }
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
          {!overallLoading && (
            <Pagination
              page={page}
              totalItems={items?.length ?? 0}
              itemsPerPage={responsiveItemsPerPage}
              onPageChange={setPage}
            />
          )}
        </Box>
      </Flex>
    </>
  )
}
