import { LiquidityMiningCampaign, Pair } from 'dxswap-sdk'
import React, { useCallback, useEffect, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import Pagination from '../../../../Pagination'
import { LiquidityMiningCampaignModal } from '../../LiquidityMiningCampaignModal'
import Empty from '../../../Empty'
import LoadingList from '../../../LoadingList'
import { usePage } from '../../../../../hooks/usePage'
import { useTokenBalance } from '../../../../../state/wallet/hooks'
import { useActiveWeb3React } from '../../../../../hooks'
import { useWindowSize } from '../../../../../hooks/useWindowSize'
import { MEDIA_WIDTHS } from '../../../../../theme'
import PairCard from '../../../PairsList/Pair'
import { useNativeCurrencyUSDPrice } from '../../../../../hooks/useNativeCurrencyUSDPrice'
import { getStakedAmountUSD } from '../../../../../utils/liquidityMining'

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
  items?: { campaign: LiquidityMiningCampaign; staked: boolean }[]
  loading?: boolean
}

const { upToSmall, upToMedium } = MEDIA_WIDTHS

export default function List({ stakablePair, loading, items }: LiquidityMiningCampaignsListProps) {
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const [responsiveItemsPerPage, setResponsiveItemsPerPage] = useState(3)
  const itemsPage = usePage(items || [], responsiveItemsPerPage, page, 0)
  const stakableTokenBalance = useTokenBalance(account ?? undefined, stakablePair?.liquidityToken)
  const [selectedCampaign, setSelectedCampaign] = useState<LiquidityMiningCampaign | null>(null)
  const { width } = useWindowSize()
  const { loading: loadingNativeCurrencyUsdPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()

  const handleLiquidityMiningCampaignModalDismiss = useCallback(() => {
    setSelectedCampaign(null)
  }, [])

  const getLiquidityMiningClickHandler = (liquidityMiningCampaign: LiquidityMiningCampaign) => () => {
    setSelectedCampaign(liquidityMiningCampaign)
  }

  useEffect(() => {
    if (!width) return
    else if (width <= upToSmall) setResponsiveItemsPerPage(1)
    else if (width <= upToMedium) setResponsiveItemsPerPage(2)
    else setResponsiveItemsPerPage(3)
  }, [width])

  const overallLoading = loading || loadingNativeCurrencyUsdPrice || !items

  return (
    <>
      <Flex flexDirection="column">
        <Box mb="8px" height="100px">
          {overallLoading ? (
            <LoadingList itemsAmount={responsiveItemsPerPage} />
          ) : itemsPage.length > 0 ? (
            <ListLayout>
              {itemsPage.map((item, index) => (
                <div key={index} onClick={getLiquidityMiningClickHandler(item.campaign)}>
                  <PairCard
                    token0={stakablePair?.token0}
                    token1={stakablePair?.token1}
                    usdLiquidity={getStakedAmountUSD(item.campaign, nativeCurrencyUSDPrice)}
                    apy={item.campaign.apy}
                    staked={item.staked}
                    usdLiquidityText="STAKED"
                  />
                </div>
              ))}
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
      {selectedCampaign && (
        <LiquidityMiningCampaignModal
          show={!!selectedCampaign}
          onDismiss={handleLiquidityMiningCampaignModalDismiss}
          campaign={selectedCampaign}
          stakableTokenBalance={stakableTokenBalance}
        />
      )}
    </>
  )
}
