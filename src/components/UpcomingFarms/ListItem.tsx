import React from 'react'
import { useMedia } from 'react-use'
import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'

import { NETWORK_ICON, NETWORK_LABEL } from 'constants/networks'
import { UpcomingPool } from 'constants/upcoming-pools'
import { ExternalLink } from 'theme'
import { DataText, DataTitle, GridItem } from 'components/YieldPools/styleds'
import PoolTokens from './PoolTokens'
import StartingIn from './StartingIn'
import { StyledImg, TableRow, StyledItemCard, NetworkLabel } from './styled'

const ListItem = ({ pool, isLastItem }: { pool: UpcomingPool; isLastItem: boolean }) => {
  const breakpoint = useMedia('(min-width: 1000px)')

  if (breakpoint) {
    return (
      <TableRow key={`${pool.poolToken1Symbol}_${pool.poolToken2Symbol}`} isLastItem={isLastItem}>
        <Flex grid-area="pools" alignItems="center" justifyContent="flex-start">
          <PoolTokens pool={pool} />
        </Flex>
        <Flex grid-area="startingIn" alignItems="center" justifyContent="flex-start">
          <StartingIn startingIn={pool.startingIn} />
        </Flex>
        <Flex grid-area="network" alignItems="center" justifyContent="flex-start">
          <img src={NETWORK_ICON[pool.network]} alt="Network Logo" style={{ width: '16px', marginRight: '4px' }} />
          <NetworkLabel>{NETWORK_LABEL[pool.network]}</NetworkLabel>
        </Flex>
        <Flex grid-area="rewards" alignItems="right" justifyContent="flex-end">
          {pool.rewards.map((reward, index) => (
            <StyledImg key={index} src={reward.logo} alt="logo" width="16px" height="16px" />
          ))}
        </Flex>
        <Flex grid-area="information" alignItems="center" justifyContent="flex-end">
          <ExternalLink href={pool.information}>
            <Trans>Learn more</Trans> ↗
          </ExternalLink>
        </Flex>
      </TableRow>
    )
  }

  return (
    <StyledItemCard isLastItem={isLastItem}>
      <GridItem>
        <DataTitle>
          <span>
            <Trans>Pools</Trans>
          </span>
        </DataTitle>
        <DataText>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PoolTokens pool={pool} />
          </div>
        </DataText>
      </GridItem>

      <GridItem>
        <DataTitle>
          <span>
            <Trans>Network</Trans>
          </span>
        </DataTitle>
        <DataText>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={NETWORK_ICON[pool.network]} alt="Network Logo" style={{ width: '16px', marginRight: '4px' }} />
            <NetworkLabel>{NETWORK_LABEL[pool.network]}</NetworkLabel>
          </div>
        </DataText>
      </GridItem>

      <GridItem>
        <DataTitle>
          <span>
            <Trans>Rewards</Trans>
          </span>
        </DataTitle>
        <DataText>
          {pool.rewards.map((reward, index) => (
            <StyledImg key={index} src={reward.logo} alt="logo" width="16px" height="16px" />
          ))}
        </DataText>
      </GridItem>

      <GridItem>
        <DataTitle>
          <span>
            <Trans>Starting In</Trans>
          </span>
        </DataTitle>
        <DataText>
          <StartingIn startingIn={pool.startingIn} />
        </DataText>
      </GridItem>

      <GridItem noBorder>
        <DataTitle style={{ marginBottom: 0, display: 'flex', alignItems: 'center' }}>
          <span>
            <Trans>Information</Trans>
          </span>
        </DataTitle>
      </GridItem>

      <GridItem noBorder>
        <DataText>
          <ExternalLink href={pool.information}>
            <span style={{ fontWeight: 600 }}>
              <Trans>Learn more</Trans> ↗
            </span>
          </ExternalLink>
        </DataText>
      </GridItem>
    </StyledItemCard>
  )
}

export default ListItem
