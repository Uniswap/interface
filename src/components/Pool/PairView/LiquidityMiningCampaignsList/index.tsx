import { LiquidityMiningCampaign, Pair } from 'dxswap-sdk'
import React, { useCallback, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import Pagination from '../../../Pagination'
import { LiquidityMiningCampaignModal } from '../LiquidityMiningCampaignModal'
import PairCard from '../../Token0PairsList/Pair'
import Empty from '../../Empty'
import { getRemainingRewardsUSD } from '../../../../utils/liquidityMining'
import { useNativeCurrencyUSDPrice } from '../../../../hooks/useNativeCurrencyUSDPrice'
import LoadingList from '../../LoadingList'
import { usePage } from '../../../../hooks/usePage'
import { useTokenBalance } from '../../../../state/wallet/hooks'
import { useActiveWeb3React } from '../../../../hooks'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 9px;
  grid-template-columns: auto auto auto;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: auto;
    grid-gap: 10px;
  `};
`

const SizedPairCard = styled(PairCard)`
  width: 180px;
  height: 155px;
`

interface LiquidityMiningCampaignsListProps {
  stakablePair?: Pair
  items: LiquidityMiningCampaign[]
}

const ITEMS_PER_PAGE = 9

export default function LiquidityMiningCampaignsList({ stakablePair, items }: LiquidityMiningCampaignsListProps) {
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const itemsPage = usePage(items, ITEMS_PER_PAGE, page, 0)
  const stakableTokenBalance = useTokenBalance(account ?? undefined, stakablePair?.liquidityToken)
  const { loading: loadingNativeCurrencyUsdPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()
  const [selectedCampaign, setSelectedCampaign] = useState<LiquidityMiningCampaign | null>(null)

  const handleLiquidityMiningCampaignModalDismiss = useCallback(() => {
    setSelectedCampaign(null)
  }, [])

  const getLiquidityMiningClickHandler = (liquidityMiningCampaign: LiquidityMiningCampaign) => () => {
    setSelectedCampaign(liquidityMiningCampaign)
  }

  return (
    <>
      <Flex flexDirection="column">
        <Box mb="8px" height="460px">
          {loadingNativeCurrencyUsdPrice ? (
            <LoadingList wideCards />
          ) : itemsPage.length > 0 ? (
            <ListLayout>
              {itemsPage.map((item, index) => (
                <div key={index} onClick={getLiquidityMiningClickHandler(item)}>
                  <SizedPairCard
                    token0={stakablePair?.token0}
                    token1={stakablePair?.token1}
                    usdRewards={getRemainingRewardsUSD(item, nativeCurrencyUSDPrice)}
                    apy={item.apy}
                  />
                </div>
              ))}
            </ListLayout>
          ) : (
            <Empty>
              <Text fontSize="12px" fontWeight="700" lineHeight="15px" letterSpacing="0.08em">
                NO REWARD POOLS YET
              </Text>
            </Empty>
          )}
        </Box>
        <Box alignSelf="flex-end" mt="16px">
          <Pagination page={page} totalItems={items.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPage} />
        </Box>
      </Flex>
      {selectedCampaign && stakableTokenBalance && (
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
