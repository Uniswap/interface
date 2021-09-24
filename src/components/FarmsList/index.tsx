import React from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'

import InfoHelper from 'components/InfoHelper'
import ListItem from './ListItem'
import { Farm } from 'state/farms/types'

const FarmListWrapper = styled.div`
  padding-bottom: 50px;
  background-color: ${({ theme }) => theme.bg15};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    background: transparent;
  `}
`

const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 3rem;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 0.25fr;
  grid-template-areas: 'pools liq end apy reward staked_balance expand';
  padding: 15px 36px 13px 26px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.evenRow};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-gap: 1rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-gap: 1.5rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-gap: 1.5rem;
  `};
`

const ClickableText = styled(Text)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.text6};
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
  user-select: none;
  text-transform: uppercase;
`

interface FarmsListProps {
  farms: Farm[]
}

const FarmsList = ({ farms }: FarmsListProps) => {
  const xxlBreakpoint = useMedia('(min-width: 1200px)')

  const renderHeader = () => {
    return xxlBreakpoint ? (
      <TableHeader>
        <Flex grid-area="pools" alignItems="center" justifyContent="flex-start">
          <ClickableText>
            <Trans>Pools | AMP</Trans>
          </ClickableText>
          <InfoHelper
            text={t`AMP = Amplification factor. Amplified pools have higher capital efficiency. Higher AMP, higher capital efficiency and amplified liquidity within a price range.`}
          />
        </Flex>

        <Flex grid-area="liq" alignItems="center" justifyContent="flex-center">
          <ClickableText>
            <Trans>Staked TVL</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="end" alignItems="right" justifyContent="flex-end">
          <ClickableText>
            <Trans>Ending In</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="apy" alignItems="center" justifyContent="flex-start">
          <ClickableText>
            <Trans>APY</Trans>
          </ClickableText>
          <InfoHelper text={t`Estimated total annualized yield from fees + rewards`} />
        </Flex>

        <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>My Rewards</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>My Deposit</Trans>
          </ClickableText>
        </Flex>
      </TableHeader>
    ) : null
  }

  return (
    <FarmListWrapper>
      {renderHeader()}
      {farms.map((farm, index) => {
        if (farm) {
          return (
            <ListItem key={`${farm.fairLaunchAddress}_${farm.stakeToken}`} farm={farm} oddRow={(index + 1) % 2 !== 0} />
          )
        }

        return null
      })}
    </FarmListWrapper>
  )
}

export default FarmsList
