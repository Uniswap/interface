import React from 'react'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { Trans } from '@lingui/macro'

import { ChainId } from 'libs/sdk/src'
import RainMakerBannel from 'assets/images/rain-maker.png'
import RainMakerMobileBanner from 'assets/images/rain-maker-mobile.png'
import { UPCOMING_POOLS } from 'constants/upcoming-pools'
import { AdContainer, ClickableText } from 'components/YieldPools/styleds'
import { useActiveWeb3React } from 'hooks'
import NoFarms from './NoFarms'
import ListItem from './ListItem'
import { TableWrapper, TableHeader, RowsWrapper } from './styled'

const UpcomingFarms = ({ setActiveTab }: { setActiveTab: (activeTab: number) => void }) => {
  const { chainId } = useActiveWeb3React()
  const lgBreakpoint = useMedia('(min-width: 1000px)')
  const upcomingPools = UPCOMING_POOLS[chainId as ChainId]

  const renderHeader = () => {
    if (!lgBreakpoint) {
      return null
    }

    return (
      <TableHeader>
        <Flex grid-area="pools" alignItems="center" justifyContent="flex-start">
          <ClickableText>
            <Trans>Pools</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="liq" alignItems="center" justifyContent="flex-start">
          <ClickableText>
            <Trans>Starting In</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="end" alignItems="right" justifyContent="flex-end">
          <ClickableText>
            <Trans>Rewards</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="apy" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>Information</Trans>
          </ClickableText>
        </Flex>
      </TableHeader>
    )
  }

  return (
    <>
      <AdContainer>
        <img src={lgBreakpoint ? RainMakerBannel : RainMakerMobileBanner} alt="RainMaker" width="100%" />
      </AdContainer>

      {upcomingPools.length > 0 ? (
        <TableWrapper>
          {renderHeader()}
          <RowsWrapper>
            {upcomingPools?.map((pool, index) => (
              <ListItem key={index} pool={pool} isLastItem={index === upcomingPools.length - 1} />
            ))}
          </RowsWrapper>
        </TableWrapper>
      ) : (
        <NoFarms setActiveTab={setActiveTab} />
      )}
    </>
  )
}

export default UpcomingFarms
