import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { useTranslation } from 'react-i18next'
import { Fraction, JSBI, Pair } from 'libs/sdk/src'
import { ChevronUp, ChevronDown } from 'react-feather'

import { ButtonEmpty } from 'components/Button'
import FavoriteStar from 'components/Icons/FavoriteStar'
import AddCircle from 'components/Icons/AddCircle'
import InfoHelper from 'components/InfoHelper'
import LocalLoader from 'components/LocalLoader'
import { shortenAddress, formattedNum } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { currencyId } from 'utils/currencyId'

const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: repeat(8, 1fr) 0.25fr;
  grid-template-areas: 'pool ratio liq vol';
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

const TableRow = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: repeat(8, 1fr) 0.25fr;
  grid-template-areas: 'pool ratio liq vol';
  padding: 15px 36px 13px 26px;
  font-size: 12px;
  align-items: flex-start;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme, oddRow }) => (oddRow ? theme.oddRow : theme.evenRow)};
  border: 1px solid transparent;

  &:hover {
    border: 1px solid #4a636f;
  }
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

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`

const LoadMoreButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.oddRow};
  font-size: 12px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
`

const ListItem = ({ pair, isFavorite, oddRow }: { pair: Pair; isFavorite?: boolean; oddRow?: boolean }) => {
  const amp = pair.virtualReserve0.divide(pair?.reserve0)
  const percentToken0 = pair.virtualReserve0
    .divide(pair.reserve0)
    .multiply('100')
    .divide(pair.virtualReserve0.divide(pair.reserve0).add(pair.virtualReserve1.divide(pair.reserve1)))
  const percentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(percentToken0)
  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(pair?.liquidityToken.address, 3)
  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  // TODO: Implement this function
  const getMyLiquidity = () => {
    return `--/--`
  }

  return (
    <TableRow oddRow={oddRow}>
      {isFavorite && (
        <div style={{ position: 'absolute' }}>
          <FavoriteStar />
        </div>
      )}
      <DataText grid-area="pool">{shortenPoolAddress}</DataText>
      <DataText grid-area="ratio">
        <div>{`• ${percentToken0.toSignificant(2) ?? '.'}% ${pair.token0.symbol}`}</div>
        <div>{`• ${percentToken1.toSignificant(2) ?? '.'}% ${pair.token1.symbol}`}</div>
      </DataText>
      <DataText grid-area="liq">{formattedNum('0', true)}</DataText>
      <DataText grid-area="vol">{formattedNum('0', true)}</DataText>
      <DataText>{formattedNum(JSBI.multiply(pair?.fee, JSBI.BigInt(0)).toString(), true)}</DataText>
      <DataText>{formattedNum(amp.toSignificant(5))}</DataText>
      <DataText>{formattedNum('0')}</DataText>
      <DataText>{getMyLiquidity()}</DataText>
      <DataText>
        {
          <ButtonEmpty
            padding="0"
            as={Link}
            to={`/add/${currencyId(currency0)}/${currencyId(currency1)}/${pair.address}`}
            width="fit-content"
          >
            <AddCircle />
          </ButtonEmpty>
        }
      </DataText>
    </TableRow>
  )
}

interface PoolListProps {
  pairs: (Pair | null)[]
  maxItems?: number
}

const SORT_FIELD = {
  LIQ: 0,
  VOL: 1,
  FEES: 2,
  APY: 3
}

// TODO: Update this function
const FIELD_TO_VALUE = (field: number) => {
  switch (field) {
    case SORT_FIELD.LIQ:
      return field
    case SORT_FIELD.VOL:
      return field
    case SORT_FIELD.FEES:
      return field
    case SORT_FIELD.APY:
      return field
    default:
      return field
  }
}

const PoolList = ({ pairs, maxItems = 10 }: PoolListProps) => {
  const { t } = useTranslation()

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)
  const ITEMS_PER_PAGE = maxItems

  // sorting
  const [sortDirection, setSortDirection] = useState(true)
  const [sortedColumn, setSortedColumn] = useState(SORT_FIELD.LIQ)

  useEffect(() => {
    setMaxPage(1) // edit this to do modular
    setPage(1)
  }, [pairs])

  useEffect(() => {
    if (pairs) {
      let extraPages = 1
      if (Object.keys(pairs).length % ITEMS_PER_PAGE === 0) {
        extraPages = 0
      }
      setMaxPage(Math.floor(Object.keys(pairs).length / ITEMS_PER_PAGE) + extraPages)
    }
  }, [ITEMS_PER_PAGE, pairs])

  return (
    <div>
      <TableHeader>
        <Flex alignItems="center" justifyContent="flexStart">
          <ClickableText>Pool</ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>Ratio</ClickableText>
          <InfoHelper text={'Based on 24hr volume annualized'} />
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.LIQ)
              setSortDirection(sortedColumn !== SORT_FIELD.LIQ ? true : !sortDirection)
            }}
          >
            Liquidity
            {sortedColumn === SORT_FIELD.LIQ ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.VOL)
              setSortDirection(sortedColumn !== SORT_FIELD.VOL ? true : !sortDirection)
            }}
          >
            Volume
            {sortedColumn === SORT_FIELD.VOL ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.FEES)
              setSortDirection(sortedColumn !== SORT_FIELD.FEES ? true : !sortDirection)
            }}
          >
            Fee (24h)
            {sortedColumn === SORT_FIELD.FEES ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>AMP</ClickableText>
          <InfoHelper text={'Based on 24hr volume annualized'} />
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.APY)
              setSortDirection(sortedColumn !== SORT_FIELD.APY ? true : !sortDirection)
            }}
          >
            1y F/L
            {sortedColumn === SORT_FIELD.APY ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>My liquidity</ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd" />
      </TableHeader>
      {!pairs ? (
        <LocalLoader />
      ) : (
        pairs.slice(0, page * ITEMS_PER_PAGE).map((pair, index) => {
          if (pair) {
            return <ListItem key={pair.address} pair={pair} oddRow={(index + 1) % 2 !== 0} isFavorite={index < 2} />
          }

          return null
        })
      )}
      <LoadMoreButtonContainer>
        <ButtonEmpty
          onClick={() => {
            setPage(page === maxPage ? page : page + 1)
          }}
          disabled={page >= maxPage}
        >
          {t('showMorePools')}
        </ButtonEmpty>
      </LoadMoreButtonContainer>
    </div>
  )
}

export default PoolList
