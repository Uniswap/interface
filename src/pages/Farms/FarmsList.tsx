import React, { useMemo } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { useMedia } from 'react-use'

import ListItem, { ItemCard } from './ListItem'
import { Farm } from 'state/types'

const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: 2fr 1fr 1fr 0.5fr 1fr 1fr 1fr 1.25fr 0.2fr;
  grid-template-areas: 'pools liq apy amp your_staked earnings claim stake dropdown';
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
  farmsList: Farm[]
}

const FarmsList = ({ farmsList }: FarmsListProps) => {
  const above1200 = useMedia('(min-width: 1200px)') // Extra large screen

  const renderHeader = () => {
    return above1200 ? (
      <TableHeader>
        <Flex grid-area="pools" alignItems="center" justifyContent="flexStart">
          <ClickableText>Pools</ClickableText>
        </Flex>
        <Flex grid-area="liq" alignItems="center" justifyContent="flexEnd">
          <ClickableText>Liquidity</ClickableText>
        </Flex>
        <Flex grid-area="apy" alignItems="center" justifyContent="flexEnd">
          <ClickableText>APY</ClickableText>
        </Flex>
        <Flex grid-area="amp" alignItems="center">
          <ClickableText>AMP</ClickableText>
        </Flex>

        <Flex grid-area="your_staked" alignItems="center" justifyContent="flexEnd">
          <ClickableText>Your Staked</ClickableText>
        </Flex>

        <Flex grid-area="earnings" alignItems="center" justifyContent="flexEnd">
          <ClickableText>Earnings</ClickableText>
        </Flex>

        <Flex grid-area="claim" alignItems="center" justifyContent="flexEnd" />
        <Flex grid-area="stake" alignItems="center" justifyContent="flexEnd" />
        <Flex grid-area="dropdown" alignItems="center" justifyContent="flexEnd" />
      </TableHeader>
    ) : null
  }

  const farms: Farm[] = useMemo(() => {
    return farmsList
  }, [farmsList])

  return (
    <div>
      {renderHeader()}
      {farms.map((farm, index) => {
        if (farm) {
          return above1200 ? (
            <ListItem key={farm.lpAddress} farm={farm} oddRow={(index + 1) % 2 !== 0} />
          ) : (
            <ItemCard key={farm.lpAddress} farm={farm} oddRow={(index + 1) % 2 !== 0} />
          )
        }

        return null
      })}
    </div>
  )
}

export default FarmsList
