import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Flex } from 'rebass'
import { MoreHorizontal } from 'react-feather'
import { useDispatch } from 'react-redux'

import { Fraction, JSBI, Pair } from 'libs/sdk/src'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import WarningLeftIcon from 'components/Icons/WarningLeftIcon'
import AddCircle from 'components/Icons/AddCircle'
import { MouseoverTooltip } from 'components/Tooltip'
import CopyHelper from 'components/Copy'
import { usePoolDetailModalToggle } from 'state/application/hooks'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { shortenAddress, formattedNum } from 'utils'
import { currencyId } from 'utils/currencyId'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { getMyLiquidity, priceRangeCalcByPair, feeRangeCalc } from 'utils/dmm'
import { setSelectedPool } from 'state/pools/actions'

const TableRow = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: repeat(8, 1fr) 1fr 1.5fr;
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
  grid-column-gap: 4px;
  border-radius: 10px;
  margin-bottom: 0;
  padding: 8px 20px 24px 20px;
  background-color: ${({ theme }) => theme.bg6};
  font-size: 12px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-bottom: 20px;
  `}
`

const GridItem = styled.div<{ noBorder?: boolean }>`
  margin-top: 8px;
  margin-bottom: 8px;
  border-bottom: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px dashed ${theme.border}`)};
  padding-bottom: 12px;
`

const TradeButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  grid-column: 1 / span 3;
`

const TradeButtonText = styled.span`
  font-size: 14px;
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

const ButtonWrapper = styled(Flex)`
  justify-content: space-between;
`

const StyledMoreHorizontal = styled(MoreHorizontal)`
  color: ${({ theme }) => theme.text9};
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

  const realPercentToken0 = pool
    ? pool.reserve0
        .divide(pool.virtualReserve0)
        .multiply('100')
        .divide(pool.reserve0.divide(pool.virtualReserve0).add(pool.reserve1.divide(pool.virtualReserve1)))
    : new Fraction(JSBI.BigInt(50))

  const realPercentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(realPercentToken0 as Fraction)

  const percentToken0 = realPercentToken0.toSignificant(5)
  const percentToken1 = realPercentToken1.toSignificant(5)

  const isWarning = realPercentToken0.lessThan(JSBI.BigInt(10)) || realPercentToken1.lessThan(JSBI.BigInt(10))

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

        <GridItem noBorder style={{ gridColumn: '1 / span 2' }}>
          <DataTitle>Price Range</DataTitle>
          <DataText>
            {pool.token0.symbol}/{pool.token1.symbol}: {priceRangeCalcByPair(pool)[0][0]?.toSignificant(6) ?? '0'} -{' '}
            {priceRangeCalcByPair(pool)[0][1]?.toSignificant(6) ?? '♾️'}
          </DataText>
          <DataText>
            {pool.token1.symbol}/{pool.token0.symbol}: {priceRangeCalcByPair(pool)[1][0]?.toSignificant(6) ?? '0'} -{' '}
            {priceRangeCalcByPair(pool)[1][1]?.toSignificant(6) ?? '♾️'}
          </DataText>
        </GridItem>
        <GridItem noBorder>
          <DataTitle>Fee Range</DataTitle>
          <DataText>
            {feeRangeCalc(!!pool?.amp ? +new Fraction(pool.amp).divide(JSBI.BigInt(10000)).toSignificant(5) : +amp)}
          </DataText>
        </GridItem>

        <TradeButtonWrapper>
          <ButtonPrimary
            padding="8px 48px"
            as={Link}
            to={`/swap?inputCurrency=${currencyId(currency0)}&outputCurrency=${currencyId(currency1)}`}
            width="fit-content"
          >
            <TradeButtonText>Trade</TradeButtonText>
          </ButtonPrimary>
        </TradeButtonWrapper>
      </StyledItemCard>
    </div>
  )
}

const ListItem = ({ pool, subgraphPoolData, myLiquidity, oddRow }: ListItemProps) => {
  const dispatch = useDispatch()
  const togglePoolDetailModal = usePoolDetailModalToggle()

  const amp = new Fraction(pool.amp).divide(JSBI.BigInt(10000))

  const realPercentToken0 = pool
    ? pool.reserve0
        .divide(pool.virtualReserve0)
        .multiply('100')
        .divide(pool.reserve0.divide(pool.virtualReserve0).add(pool.reserve1.divide(pool.virtualReserve1)))
    : new Fraction(JSBI.BigInt(50))

  const realPercentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(realPercentToken0 as Fraction)

  const percentToken0 = realPercentToken0.toSignificant(5)
  const percentToken1 = realPercentToken1.toSignificant(5)

  const isWarning = realPercentToken0.lessThan(JSBI.BigInt(10)) || realPercentToken1.lessThan(JSBI.BigInt(10))

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(pool?.liquidityToken.address, 3)
  const currency0 = unwrappedToken(pool.token0)
  const currency1 = unwrappedToken(pool.token1)

  const volume = subgraphPoolData.oneDayVolumeUSD
    ? subgraphPoolData.oneDayVolumeUSD
    : subgraphPoolData.oneDayVolumeUntracked

  const fee = subgraphPoolData.oneDayFeeUSD ? subgraphPoolData.oneDayFeeUSD : subgraphPoolData.oneDayFeeUntracked

  const oneYearFL = getOneYearFL(subgraphPoolData.reserveUSD, fee).toFixed(2)

  const handleShowMore = () => {
    dispatch(
      setSelectedPool({
        pool,
        subgraphPoolData,
        myLiquidity
      })
    )
    togglePoolDetailModal()
  }

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
      <ButtonWrapper>
        <ButtonEmpty
          padding="0"
          as={Link}
          to={`/add/${currencyId(currency0)}/${currencyId(currency1)}/${pool.address}`}
          width="fit-content"
        >
          <AddCircle />
        </ButtonEmpty>
      </ButtonWrapper>
      <ButtonWrapper>
        <ButtonPrimary
          padding="8px 16px"
          as={Link}
          to={`/swap?inputCurrency=${currencyId(currency0)}&outputCurrency=${currencyId(currency1)}`}
          width="fit-content"
        >
          Trade
        </ButtonPrimary>
        <ButtonEmpty padding="0" width="fit-content" onClick={handleShowMore}>
          <StyledMoreHorizontal />
        </ButtonEmpty>
      </ButtonWrapper>
    </TableRow>
  )
}

export default ListItem
