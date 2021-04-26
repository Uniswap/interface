import React, { useMemo } from 'react'
import { Position } from '@uniswap/v3-sdk'
import Badge, { BadgeVariant } from 'components/Badge'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { usePool } from 'hooks/usePools'
import { useToken } from 'hooks/Tokens'
import { AlertTriangle } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'
import { basisPointsToPercent } from 'utils'
import { TokenAmount, WETH9, Price, Token } from '@uniswap/sdk-core'
import { formatPrice, formatTokenAmount } from 'utils/formatTokenAmount'
import Loader from 'components/Loader'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { DAI, USDC, USDT, WBTC } from '../../constants'

const ActiveDot = styled.span`
  background-color: ${({ theme }) => theme.success};
  border-radius: 50%;
  height: 8px;
  width: 8px;
  margin-right: 4px;
`
const Row = styled(Link)`
  align-items: center;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.text1};
  margin: 8px 0;
  padding: 8px;
  text-decoration: none;
  font-weight: 500;
  &:first-of-type {
    margin: 0 0 8px 0;
  }
  &:last-of-type {
    margin: 8px 0 0 0;
  }

  & > div:not(:first-child) {
    text-align: right;
    min-width: 18%;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    flex-direction: row;
  }
  :hover {
    background-color: ${({ theme }) => theme.bg1};
  }
`
const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`
const BadgeWrapper = styled.div`
  font-size: 14px;
`
const DataLineItem = styled.div`
  text-align: right;
  font-size: 14px;
`
const DoubleArrow = styled.span`
  color: ${({ theme }) => theme.text3};
`
const RangeData = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  & > div {
    align-items: center;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
    & > div {
      display: block;
    }
  }
`
const AmountData = styled.div`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
  }
`
const FeeData = styled.div`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
  }
`
const LabelData = styled.div`
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  justify-content: space-between;
  width: 100%;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
  }
`
const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px 0 12px 0;
  > * {
    margin-right: 8px;
  }
`

const DataText = styled.div`
  font-weight: 500;
`

export interface PositionListItemProps {
  positionDetails: PositionDetails
}

export function getPriceOrderingFromPositionForUI(
  position?: Position
): {
  priceLower?: Price
  priceUpper?: Price
  quote?: Token
  base?: Token
} {
  if (!position) {
    return {}
  }

  const token0 = position.amount0.token
  const token1 = position.amount1.token

  // if token0 is a dollar-stable asset, set it as the quote token
  const stables = [DAI, USDC, USDT]
  if (stables.some((stable) => stable.equals(token0))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if token1 is an ETH-/BTC-stable asset, set it as the base token
  const bases = [...Object.values(WETH9), WBTC]
  if (bases.some((base) => base.equals(token1))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if both prices are below 1, invert
  if (position.token0PriceUpper.lessThan(1)) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // otherwise, just return the default
  return {
    priceLower: position.token0PriceUpper.invert(),
    priceUpper: position.token0PriceLower.invert(),
    quote: token1,
    base: token0,
  }
}

export default function PositionListItem({ positionDetails }: PositionListItemProps) {
  const { t } = useTranslation()

  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
  } = positionDetails

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const position = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  // liquidity amounts in tokens
  const amount0: TokenAmount | undefined = position?.amount0
  const amount1: TokenAmount | undefined = position?.amount1
  const formattedAmount0 = formatTokenAmount(amount0, 4)
  const formattedAmount1 = formatTokenAmount(amount1, 4)

  // prices
  const { priceLower, priceUpper, base } = getPriceOrderingFromPositionForUI(position)
  const inverted = token1 ? base?.equals(token1) : undefined
  const currencyQuote = inverted ? currency0 : currency1
  const currencyBase = inverted ? currency1 : currency0

  // fees
  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, positionDetails)

  // check if price is within range
  const outOfRange: boolean = pool ? pool.tickCurrent < tickLower || pool.tickCurrent > tickUpper : false

  const positionSummaryLink = '/pool/' + positionDetails.tokenId

  return (
    <Row to={positionSummaryLink}>
      <LabelData>
        <PrimaryPositionIdData>
          <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={16} margin />
          <DataText>
            &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
          </DataText>
          &nbsp;
          <Badge>
            <BadgeText>{basisPointsToPercent(feeAmount / 100).toSignificant()}%</BadgeText>
          </Badge>
        </PrimaryPositionIdData>
        <BadgeWrapper>
          {outOfRange ? (
            <Badge variant={BadgeVariant.WARNING}>
              <AlertTriangle width={14} height={14} style={{ marginRight: '4px' }} />
              &nbsp;
              <BadgeText>{t('Out of range')}</BadgeText>
            </Badge>
          ) : (
            <Badge variant={BadgeVariant.DEFAULT}>
              <ActiveDot /> &nbsp;
              <BadgeText>{t('Active')}</BadgeText>
            </Badge>
          )}
        </BadgeWrapper>
      </LabelData>
      <RangeData>
        {priceLower && priceUpper ? (
          <>
            <DataLineItem>
              {formatPrice(priceLower, 4)} <DoubleArrow>↔</DoubleArrow> {formatPrice(priceUpper, 4)}{' '}
              {currencyQuote?.symbol}
              &nbsp;/&nbsp;
              {currencyBase?.symbol}
            </DataLineItem>
          </>
        ) : (
          <Loader />
        )}
      </RangeData>
      <AmountData>
        {formattedAmount0 && formattedAmount1 ? (
          <>
            <DataLineItem>
              {inverted ? formattedAmount0 : formattedAmount1}&nbsp;{currencyQuote?.symbol}
            </DataLineItem>
            <DataLineItem>
              {inverted ? formattedAmount1 : formattedAmount0}&nbsp;{currencyBase?.symbol}
            </DataLineItem>
          </>
        ) : (
          <Loader />
        )}
      </AmountData>
      <FeeData>
        {feeValue0 && feeValue1 ? (
          <>
            <DataLineItem>
              {formatTokenAmount(inverted ? feeValue0 : feeValue1, 4)}&nbsp;{currencyQuote?.symbol}
            </DataLineItem>
            <DataLineItem>
              {formatTokenAmount(inverted ? feeValue1 : feeValue0, 4)}&nbsp;{currencyBase?.symbol}
            </DataLineItem>
          </>
        ) : (
          <Loader />
        )}
      </FeeData>
    </Row>
  )
}
