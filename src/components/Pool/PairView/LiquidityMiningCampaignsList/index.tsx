import { Pair } from 'dxswap-sdk'
import React, { useCallback, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { NonExpiredLiquidityMiningCampaign } from '../../../../apollo/queries'
import Pagination from '../../../Pagination'
import { LiquidityMiningCampaignModal } from '../LiquidityMiningCampaignModal'
import PairCard from '../../Token0PairsList/Pair'
import Empty from '../../Empty'
import { getCampaignApy, getRemainingRewardsUSD } from '../../../../utils/liquidityMining'
import { useETHUSDPrice } from '../../../../hooks/useETHUSDPrice'
import LoadingList from '../../LoadingList'
import { usePairReserveETH, usePairLiquidityTokenTotalSupply } from '../../../../data/Reserves'

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
  items: NonExpiredLiquidityMiningCampaign[]
}

const ITEMS_PER_PAGE = 9

export default function LiquidityMiningCampaignsList({ stakablePair, items }: LiquidityMiningCampaignsListProps) {
  const [page, setPage] = useState(1)
  const [paginatedItems, setPaginatedItems] = useState<NonExpiredLiquidityMiningCampaign[]>(
    items.slice(0, ITEMS_PER_PAGE)
  )
  const { loading: loadingEthUsdPrice, ethUSDPrice } = useETHUSDPrice()
  const { loading: loadingPairReserveETH, reserveETH } = usePairReserveETH(stakablePair)
  const { loading: loadingPairTotalSupply, supply } = usePairLiquidityTokenTotalSupply(stakablePair)
  const [
    selectedLiquidityMiningCampaign,
    setSelectedLiquidityMiningCampaign
  ] = useState<NonExpiredLiquidityMiningCampaign | null>(null)

  const handleLiquidityMiningCampaignModalDismiss = useCallback(() => {
    setSelectedLiquidityMiningCampaign(null)
  }, [])

  const getLiquidityMiningClickHandler = (liquidityMiningCampaign: NonExpiredLiquidityMiningCampaign) => () => {
    setSelectedLiquidityMiningCampaign(liquidityMiningCampaign)
  }

  const handlePageChange = useCallback(
    page => {
      setPage(page)
      const zeroIndexPage = page - 1
      const offset = zeroIndexPage * ITEMS_PER_PAGE
      setPaginatedItems(items.slice(offset, offset + ITEMS_PER_PAGE))
    },
    [items]
  )

  return (
    <>
      <Flex flexDirection="column">
        <Box mb="8px" height="460px">
          {loadingEthUsdPrice || loadingPairReserveETH || loadingPairTotalSupply ? (
            <LoadingList wideCards />
          ) : items.length > 0 ? (
            <ListLayout>
              {paginatedItems.map(item => (
                <div key={item.address} onClick={getLiquidityMiningClickHandler(item)}>
                  <SizedPairCard
                    token0={stakablePair?.token0}
                    token1={stakablePair?.token1}
                    usdRewards={getRemainingRewardsUSD(item, ethUSDPrice)}
                    apy={getCampaignApy(
                      reserveETH,
                      supply,
                      item.duration,
                      item.startsAt,
                      item.rewardTokens,
                      item.rewardAmounts,
                      item.stakedAmount,
                      ethUSDPrice
                    )}
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
          <Pagination
            page={page}
            totalItems={items.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </Box>
      </Flex>
      <LiquidityMiningCampaignModal
        show={!!selectedLiquidityMiningCampaign}
        onDismiss={handleLiquidityMiningCampaignModalDismiss}
        contractAddress={selectedLiquidityMiningCampaign?.address ?? ''}
        stakablePair={stakablePair}
        startsAt={selectedLiquidityMiningCampaign?.startsAt ?? '0'}
        endsAt={selectedLiquidityMiningCampaign?.endsAt ?? '0'}
        timelock={!!selectedLiquidityMiningCampaign?.locked}
      />
    </>
  )
}
