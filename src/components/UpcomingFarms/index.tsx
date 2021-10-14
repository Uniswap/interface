import React from 'react'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { Trans } from '@lingui/macro'

import RainMakerBannel from 'assets/images/rain-maker.png'
import RainMakerMobileBanner from 'assets/images/rain-maker-mobile.png'
import { UPCOMING_POOLS } from 'constants/upcoming-pools'
import { AdContainer, ClickableText } from 'components/YieldPools/styleds'
import NoFarms from './NoFarms'
import ListItem from './ListItem'
import { TableWrapper, TableHeader, RowsWrapper } from './styled'

const UpcomingFarms = ({ setActiveTab }: { setActiveTab: (activeTab: number) => void }) => {
  const lgBreakpoint = useMedia('(min-width: 1000px)')

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

        <Flex grid-area="startingIn" alignItems="center" justifyContent="flex-start">
          <ClickableText>
            <Trans>Starting In</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="network" alignItems="center" justifyContent="flex-start">
          <ClickableText>
            <Trans>Network</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="rewards" alignItems="right" justifyContent="flex-end">
          <ClickableText>
            <Trans>Rewards</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="information" alignItems="center" justifyContent="flex-end">
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

      {UPCOMING_POOLS.length > 0 ? (
        <TableWrapper>
          {renderHeader()}
          <RowsWrapper>
            {UPCOMING_POOLS.map((pool, index) => (
              <ListItem key={index} pool={pool} isLastItem={index === UPCOMING_POOLS.length - 1} />
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
