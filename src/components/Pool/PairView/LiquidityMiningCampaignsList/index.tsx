import { Pair } from 'dxswap-sdk'
import React, { useCallback, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { NonExpiredLiquidityMiningCampaign } from '../../../../apollo/queries'
import Pagination from '../../../Pagination'
import { LiquidityMiningCampaignModal } from '../LiquidityMiningCampaignModal'
import PairCard from '../../Token0PairsList/Pair'
import Empty from '../../Empty'

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

export default function LiquidityMiningCampaignsList({ stakablePair, items }: LiquidityMiningCampaignsListProps) {
  const [page, setPage] = useState(0)
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

  return (
    <>
      <Flex flexDirection="column">
        <Box mb="8px" height="460px">
          {items.length > 0 ? (
            <ListLayout>
              {items.map(item => (
                <div key={item.contractAddress} onClick={getLiquidityMiningClickHandler(item)}>
                  <SizedPairCard token0={stakablePair?.token0} token1={stakablePair?.token1} />
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
        <Flex width="100%" justifyContent="flex-end">
          <Box>
            <Pagination page={page} totalItems={items.length} itemsPerPage={12} onPageChange={setPage} />
          </Box>
        </Flex>
      </Flex>
      <LiquidityMiningCampaignModal
        show={!!selectedLiquidityMiningCampaign}
        onDismiss={handleLiquidityMiningCampaignModalDismiss}
        contractAddress={selectedLiquidityMiningCampaign?.contractAddress ?? ''}
        stakablePair={stakablePair}
        startsAt={selectedLiquidityMiningCampaign?.startsAt ?? '0'}
        endsAt={selectedLiquidityMiningCampaign?.endsAt ?? '0'}
        timelock={!!selectedLiquidityMiningCampaign?.locked}
      />
    </>
  )
}
