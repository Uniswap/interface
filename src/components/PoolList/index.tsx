import React from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { Pair } from 'libs/sdk/src'

import { ButtonEmpty } from 'components/Button'
import FavoriteStar from 'components/Icons/FavoriteStar'
import QuestionHelper from 'components/QuestionHelper'
import Divider from 'components/Divider'

const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: 69px 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-template-areas: 'pool ratio liq vol';
  padding: 15px 36px 13px 26px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: #303e46;

  > * {
    justify-content: flex-end;

    :first-child {
      justify-content: flex-start;
    }
  }
`

const DashGrid = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: 69px 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-template-areas: 'pool ratio liq vol';
  padding: 15px 36px 13px 26px;
  font-size: 12px;
  align-items: flex-start;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ oddRow }) => (oddRow ? '#283339' : '#303e46')};

  > * {
    align-items: flex-end;

    :first-child {
      text-align: left;
    }
  }
`

const ClickableText = styled(Text)`
  color: ${({ theme }) => theme.text1};
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
  text-align: end;
  user-select: none;
  text-transform: uppercase;
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text1};
  flex-direction: column;
`

const LoadMoreButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: #303e46;
  font-size: 12px;
`

const ListItem = ({ pair, isFavorite, oddRow }: { pair: Pair; isFavorite?: boolean; oddRow?: boolean }) => {
  return (
    <DashGrid oddRow={oddRow}>
      {isFavorite && (
        <div style={{ position: 'absolute' }}>
          <FavoriteStar />
        </div>
      )}
      <DataText grid-area="pool">{pair?.liquidityToken.address.substr(0, 10)}</DataText>
      <DataText grid-area="ratio">
        <div>• 70% Link</div>
        <div>• 30% ETH</div>
      </DataText>
      <DataText grid-area="liq">$675,360.9876</DataText>
      <DataText grid-area="vol">$287,876.0546</DataText>
      <DataText>
        <div>Max 0.08654</div>
        <div>Min 0.06543</div>
      </DataText>
      <DataText>
        <div>Max 124.876</div>
        <div>Min 121.765</div>
      </DataText>
      <DataText>$423.981</DataText>
      <DataText>$423.981</DataText>
    </DashGrid>
  )
}

const PoolList = ({ pairs }: { pairs: (Pair | null)[] }) => {
  return (
    <div>
      <TableHeader>
        <Flex alignItems="center" justifyContent="flexStart">
          <ClickableText>Pool</ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>Ratio</ClickableText>
          <QuestionHelper text={'Based on 24hr volume annualized'} />
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>Liquidity</ClickableText>
        </Flex>
        <Flex alignItems="center">
          <ClickableText>Volume</ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>
            <div>Price Range</div>
            <div>Link/ETH</div>
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>
            <div>Price Range</div>
            <div>ETH/Link</div>
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>Fee (24h)</ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>Estimated APY</ClickableText>
          <QuestionHelper text={'Based on 24hr volume annualized'} />
        </Flex>
      </TableHeader>
      <Divider />
      {pairs.map((pair, index) => {
        if (pair) {
          return <ListItem key={pair.address} pair={pair} oddRow={(index + 1) % 2 !== 0} isFavorite={index < 2} />
        }

        return null
      })}
      <Divider />
      <LoadMoreButtonContainer>
        <ButtonEmpty>Show more pools</ButtonEmpty>
      </LoadMoreButtonContainer>
    </div>
  )
}

export default PoolList
