import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Flex } from 'rebass'

import { Fraction, JSBI, Pair } from 'libs/sdk/src'
import { ButtonEmpty } from 'components/Button'
import WarningLeftIcon from 'components/Icons/WarningLeftIcon'
import AddCircle from 'components/Icons/AddCircle'
import { MouseoverTooltip } from 'components/Tooltip'
import CopyHelper from 'components/Copy'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { shortenAddress, formattedNum } from 'utils'
import { currencyId } from 'utils/currencyId'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { getMyLiquidity } from 'utils/dmm'

const TableRow = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: repeat(8, 1fr) 1fr;
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

const StyledItemCard = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-column-gap: 8px;
  border-radius: 10px;
  margin-bottom: 20px;
  padding: 8px 20px 4px 20px;
  background-color: ${({ theme }) => theme.bg6};
  font-size: 12px;
`

const GridItem = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
`

const DataTitle = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.text6};
  &:hover {
    opacity: 0.6;
  }
  user-select: none;
  text-transform: uppercase;
  margin-bottom: 4px;
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`

const PoolAddressContainer = styled(Flex)`
  align-items: center;
`

const getOneYearFL = (liquidity: string, feeOneDay?: string): number => {
  return !feeOneDay || parseFloat(liquidity) === 0 ? 0 : (parseFloat(feeOneDay) * 365 * 100) / parseFloat(liquidity)
}

interface ListItemProps {
  pool: Pair
  subgraphPoolData: SubgraphPoolData
  myLiquidity?: UserLiquidityPosition
  oddRow?: boolean
}

export const ItemCard = ({ pool, subgraphPoolData, myLiquidity }: ListItemProps) => {
  const amp = new Fraction(pool.amp).divide(JSBI.BigInt(10000))

  const percentToken0 = pool
    ? pool.reserve0
        .divide(pool.virtualReserve0)
        .multiply('100')
        .divide(pool.reserve0.divide(pool.virtualReserve0).add(pool.reserve1.divide(pool.virtualReserve1)))
        .toSignificant(2) ?? '.'
    : '50'
  const percentToken1 = pool
    ? new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(percentToken0).toSignificant(2) ?? '.'
    : '50'

  const isWarning = parseFloat(percentToken0) < 10 || parseFloat(percentToken1) < 10

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(pool?.liquidityToken.address, 3)
  const currency0 = unwrappedToken(pool.token0)
  const currency1 = unwrappedToken(pool.token1)

  const volume = subgraphPoolData.oneDayVolumeUSD
    ? subgraphPoolData.oneDayVolumeUSD
    : subgraphPoolData.oneDayVolumeUntracked

  const fee = subgraphPoolData.oneDayFeeUSD ? subgraphPoolData.oneDayFeeUSD : subgraphPoolData.oneDayFeeUntracked

  const oneYearFL = getOneYearFL(subgraphPoolData.reserveUSD, fee).toFixed(2)

  return (
    <div>
      {isWarning && (
        <div style={{ position: 'absolute' }}>
          <MouseoverTooltip text="One token is close to 0% in the pool ratio. Pool might go inactive.">
            <WarningLeftIcon />
          </MouseoverTooltip>
        </div>
      )}

      <StyledItemCard>
        <GridItem>
          <DataTitle>Pool</DataTitle>
          <DataText grid-area="pool">
            <PoolAddressContainer>
              {shortenPoolAddress}
              <CopyHelper toCopy={pool.address} />
            </PoolAddressContainer>
          </DataText>
        </GridItem>

        <GridItem>
          <DataTitle>My liquidity</DataTitle>
          <DataText>{getMyLiquidity(myLiquidity)}</DataText>
        </GridItem>

        <GridItem>
          <DataText style={{ alignItems: 'flex-end' }}>
            {
              <ButtonEmpty
                padding="0"
                as={Link}
                to={`/add/${currencyId(currency0)}/${currencyId(currency1)}/${pool.address}`}
                width="fit-content"
              >
                <AddCircle />
              </ButtonEmpty>
            }
          </DataText>
        </GridItem>

        <GridItem>
          <DataTitle>Liquidity</DataTitle>
          <DataText grid-area="liq">{formattedNum(subgraphPoolData.reserveUSD, true)}</DataText>
        </GridItem>
        <GridItem>
          <DataTitle>Volume (24h)</DataTitle>
          <DataText grid-area="vol">{formattedNum(volume, true)}</DataText>
        </GridItem>
        <GridItem>
          <DataTitle>Ratio</DataTitle>
          <DataText grid-area="ratio">
            <div>{`• ${percentToken0}% ${pool.token0.symbol}`}</div>
            <div>{`• ${percentToken1}% ${pool.token1.symbol}`}</div>
          </DataText>
        </GridItem>

        <GridItem>
          <DataTitle>Fee (24h)</DataTitle>
          <DataText>{formattedNum(fee, true)}</DataText>
        </GridItem>
        <GridItem>
          <DataTitle>AMP</DataTitle>
          <DataText>{formattedNum(amp.toSignificant(5))}</DataText>
        </GridItem>
        <GridItem>
          <DataTitle>1y F/L</DataTitle>
          <DataText>{`${oneYearFL}%`}</DataText>
        </GridItem>
      </StyledItemCard>
    </div>
  )
}

const ListItem = ({ pool, subgraphPoolData, myLiquidity, oddRow }: ListItemProps) => {
  const amp = new Fraction(pool.amp).divide(JSBI.BigInt(10000))

  const percentToken0 = pool
    ? pool.reserve0
        .divide(pool.virtualReserve0)
        .multiply('100')
        .divide(pool.reserve0.divide(pool.virtualReserve0).add(pool.reserve1.divide(pool.virtualReserve1)))
        .toSignificant(2) ?? '.'
    : '50'
  const percentToken1 = pool
    ? new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(percentToken0).toSignificant(2) ?? '.'
    : '50'

  const isWarning = parseFloat(percentToken0) < 10 || parseFloat(percentToken1) < 10

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(pool?.liquidityToken.address, 3)
  const currency0 = unwrappedToken(pool.token0)
  const currency1 = unwrappedToken(pool.token1)

  const volume = subgraphPoolData.oneDayVolumeUSD
    ? subgraphPoolData.oneDayVolumeUSD
    : subgraphPoolData.oneDayVolumeUntracked

  const fee = subgraphPoolData.oneDayFeeUSD ? subgraphPoolData.oneDayFeeUSD : subgraphPoolData.oneDayFeeUntracked

  const oneYearFL = getOneYearFL(subgraphPoolData.reserveUSD, fee).toFixed(2)

  return (
    <TableRow oddRow={oddRow}>
      {isWarning && (
        <div style={{ position: 'absolute' }}>
          <MouseoverTooltip text="One token is close to 0% in the pool ratio. Pool might go inactive.">
            <WarningLeftIcon />
          </MouseoverTooltip>
        </div>
      )}
      <DataText grid-area="pool">
        <PoolAddressContainer>
          {shortenPoolAddress}
          <CopyHelper toCopy={pool.address} />
        </PoolAddressContainer>
      </DataText>
      <DataText grid-area="ratio">
        <div>{`• ${percentToken0}% ${pool.token0.symbol}`}</div>
        <div>{`• ${percentToken1}% ${pool.token1.symbol}`}</div>
      </DataText>
      <DataText grid-area="liq">{formattedNum(subgraphPoolData.reserveUSD, true)}</DataText>
      <DataText grid-area="vol">{formattedNum(volume, true)}</DataText>
      <DataText>{formattedNum(fee, true)}</DataText>
      <DataText>{formattedNum(amp.toSignificant(5))}</DataText>
      <DataText>{`${oneYearFL}%`}</DataText>
      <DataText>{getMyLiquidity(myLiquidity)}</DataText>
      <DataText>
        {
          <ButtonEmpty
            padding="0"
            as={Link}
            to={`/add/${currencyId(currency0)}/${currencyId(currency1)}/${pool.address}`}
            width="fit-content"
          >
            <AddCircle />
          </ButtonEmpty>
        }
      </DataText>
    </TableRow>
  )
}

export default ListItem
