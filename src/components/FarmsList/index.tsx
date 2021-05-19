import React from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { useMedia } from 'react-use'

import ListItem, { ItemCard } from './ListItem'
import { Farm } from 'state/farms/types'

const FarmListWrapper = styled.div`
  padding-bottom: 80px;
  background-color: ${({ theme }) => theme.bg15};
`

const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 2fr 2fr;
  grid-template-areas: 'pools liq apy end_in reward staked_balance stakeable_balance';
  padding: 15px 36px 13px 26px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.evenRow};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
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
  const above1200 = useMedia('(min-width: 1200px)') // Extra large screen

  const renderHeader = () => {
    return above1200 ? (
      <TableHeader>
        <Flex grid-area="pools" alignItems="center" justifyContent="flexStart">
          <ClickableText>Pools | AMP</ClickableText>
        </Flex>

        <Flex grid-area="liq" alignItems="center" justifyContent="flexEnd">
          <ClickableText>Liquidity</ClickableText>
        </Flex>

        <Flex grid-area="apy" alignItems="center" justifyContent="flexEnd">
          <ClickableText>APY</ClickableText>
        </Flex>

        <Flex grid-area="end_in" alignItems="center">
          <ClickableText>End In</ClickableText>
        </Flex>

        <Flex grid-area="reward" alignItems="center" justifyContent="flexEnd">
          <ClickableText>Your Rewards</ClickableText>
        </Flex>

        <Flex grid-area="staked_balance" alignItems="center" justifyContent="flexEnd">
          <ClickableText>Your Stake Balance</ClickableText>
        </Flex>

        <Flex grid-area="staked_balance" alignItems="center" justifyContent="flexEnd">
          <ClickableText>Your Stake-able Balance</ClickableText>
        </Flex>
      </TableHeader>
    ) : null
  }

  return (
    <FarmListWrapper>
      {renderHeader()}
      {farms.map((farm, index) => {
        if (farm) {
          return above1200 ? (
            <ListItem key={farm.id} farm={farm} oddRow={(index + 1) % 2 !== 0} />
          ) : (
            <ItemCard key={farm.id} farm={farm} oddRow={(index + 1) % 2 !== 0} />
          )
        }

        return null
      })}
    </FarmListWrapper>
  )
}

export default FarmsList
