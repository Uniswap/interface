import { Trans } from '@lingui/macro'
import { CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import RangeBadge from 'components/Badge/RangeBadge'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import { RowBetween } from 'components/Row'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'
import { unwrappedToken } from 'utils/unwrappedToken'

import { DAI, USDC, USDT, WBTC, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'

const LinkRow = styled(Link)`
  align-items: center;
  border-radius: 20px;
  display: flex;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;

  justify-content: space-between;
  color: ${({ theme }) => theme.text1};
  margin: 8px 0;
  padding: 16px;
  text-decoration: none;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg1};

  &:last-of-type {
    margin: 8px 0 0 0;
  }

  & > div:not(:first-child) {
    text-align: center;
  }

  :hover {
    background-color: ${({ theme }) => theme.bg2};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    row-gap: 12px;
  `};
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `};
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-top: 4px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
  background-color: ${({ theme }) => theme.bg2};
    border-radius: 20px;
    padding: 8px 0;
`};
`

const DoubleArrow = styled.span`
  margin: 0 2px;
  color: ${({ theme }) => theme.text3};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 4px;
    padding: 20px;
  `};
`

const RangeText = styled.span`
  /* background-color: ${({ theme }) => theme.bg2}; */
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.text3};
  font-size: 14px;
  margin-right: 4px;
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * {
    margin-right: 8px;
  }
`

const DataText = styled.div`
  font-weight: 600;
  font-size: 18px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
  `};
`

const DollarValues = styled.span`
  font-size: 12px;
  color: gray;
`

interface PositionListItemProps {
  positionDetails: PositionDetails
  isUnderfunded: boolean
}

function isToken0Stable(token0: Token | undefined): boolean {
  if (token0 == undefined) return false
  const stables = [DAI, USDC, USDT]
  let flag = false

  stables.forEach((stable) => (stable && stable.symbol && stable?.symbol == token0.symbol ? (flag = true) : ''))
  return flag
}

export function getPriceOrderingFromPositionForUI(position?: Position): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} {
  if (!position) {
    return {}
  }

  const token0 = position.amount0.currency
  const token1 = position.amount1.currency

  // if token0 is a dollar-stable asset, set it as the quote token
  const stables = [DAI, USDC, USDT]
  if (stables.some((stable) => stable && stable.symbol && stable.symbol == token1.symbol)) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if token1 is an ETH-/BTC-stable asset, set it as the base token
  const bases = [...Object.values(WRAPPED_NATIVE_CURRENCY), WBTC]
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
    priceLower: position.token0PriceLower,
    priceUpper: position.token0PriceUpper,
    quote: token1,
    base: token0,
  }
}

function countZeroes(x: string | number) {
  let counter = 0
  for (let i = 2; i < x.toString().length; i++) {
    if (x.toString().charAt(i) != '0') return counter

    counter++
  }
  return counter
}

function commafy(num: number | string | undefined) {
  if (num == undefined) return undefined
  const str = num.toString().split('.')
  if (str[0].length >= 4) {
    str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,')
  }
  return str.join('.')
}

function formatPrice(value: string | number | undefined) {
  if (value == undefined) return undefined

  if (Number(value) > 9) return commafy(Number(value).toFixed())
  const numberOfZeros = countZeroes(Number(value).toFixed(20))

  if (3 > numberOfZeros && numberOfZeros > 0) return commafy(Number(value).toFixed(3))

  if (Number(value) >= 1) return commafy(Number(value).toFixed(1))

  return commafy(Number(value).toFixed(3))
}

export default function PositionListItem({ positionDetails, isUnderfunded }: PositionListItemProps) {
  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
    processed,
    tokensOwed0,
    tokensOwed1,
  } = positionDetails

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? token0 : undefined
  const currency1 = token1 ? token1 : undefined

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const position = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  // prices
  const { priceLower, priceUpper, quote, base } = getPriceOrderingFromPositionForUI(position)

  const currencyQuote = quote && unwrappedToken(quote)
  const currencyBase = base && unwrappedToken(base)

  const inverted = token1 ? base?.equals(token1) : undefined
  // check if price is within range ; if out of range; the status is pending
  const outOfRange: boolean = pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false
  const closedOrder: boolean = processed ? true : false

  const currencyAmount = tokensOwed0.gt(0)
    ? currency0
      ? CurrencyAmount.fromRawAmount(currency0 as Token, tokensOwed0.toString())
      : undefined
    : currency1
    ? CurrencyAmount.fromRawAmount(currency1 as Token, tokensOwed1.toString())
    : undefined

  // TODO (pai) fix the target price ; upper or lower ; buy or sell

  const targetPrice = useMemo(() => {
    if (priceUpper?.baseCurrency != currencyAmount?.currency) {
      // invert
      return priceUpper?.invert()
    }
    return priceUpper
  }, [currencyAmount?.currency, priceUpper])

  const positionSummaryLink = '/pool/' + positionDetails.tokenId

  const removed = liquidity?.eq(0)

  const token0USD = useUSDCPrice(currency0 ?? undefined)?.toSignificant(4)
  const token1USD = useUSDCPrice(currency1 ?? undefined)?.toSignificant(4)

  const currentPriceUSD =
    currency0 && currencyBase?.name == unwrappedToken(currency0)?.name
      ? inverted
        ? Number(token0USD) / Number(pool?.token1Price.toSignificant(6))
        : Number(token0USD) / Number(pool?.token0Price.toSignificant(6))
      : inverted
      ? Number(token1USD) / Number(pool?.token1Price.toSignificant(6))
      : Number(token1USD) / Number(pool?.token0Price.toSignificant(6))

  const targetPriceUSD =
    currency0 && currencyBase?.name == unwrappedToken(currency0)?.name
      ? inverted
        ? Number(token0USD) / Number(priceUpper?.toSignificant(6))
        : Number(token0USD) / Number(priceUpper?.toSignificant(6))
      : inverted
      ? Number(token1USD) / Number(priceUpper?.toSignificant(6))
      : Number(token1USD) / Number(priceUpper?.toSignificant(6))

  const numberOfZeroes = pool && countZeroes((inverted ? pool?.token1Price : pool?.token0Price)?.toSignificant(6))
  const leftover = numberOfZeroes && currentPriceUSD.toFixed(20).substring(2 + numberOfZeroes)
  const numberOfZeroesTargetPrice = priceUpper && countZeroes(priceUpper?.toSignificant(6))
  const leftoverTargetPrice =
    numberOfZeroesTargetPrice && targetPriceUSD.toFixed(20).substring(2 + numberOfZeroesTargetPrice)

  const isTokenStable = isToken0Stable(pool?.token0) ?? undefined

  return (
    <LinkRow to={positionSummaryLink}>
      <RowBetween>
        <PrimaryPositionIdData>
          <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={18} margin />
          <DataText>
            &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
          </DataText>
          &nbsp;
        </PrimaryPositionIdData>
        <RangeBadge removed={removed} inRange={!outOfRange} closed={closedOrder} isUnderfunded={isUnderfunded} />
      </RowBetween>
      <RowBetween>
        <RangeText>
          <ExtentsText>
            <Trans>Current Price: </Trans>
          </ExtentsText>
        </RangeText>{' '}
        <RangeText>
          <Trans>
            {inverted ? commafy(pool?.token1Price.toSignificant(3)) : commafy(pool?.token0Price.toSignificant(6))}{' '}
            <HoverInlineText text={currencyQuote?.symbol} /> per <HoverInlineText text={currencyBase?.symbol ?? ''} />{' '}
            <DollarValues>
              {currentPriceUSD && !isTokenStable ? <span>(${formatPrice(currentPriceUSD)})</span> : ''}{' '}
            </DollarValues>
          </Trans>
        </RangeText>{' '}
      </RowBetween>
      <RowBetween>
        <RangeText>
          <ExtentsText>
            <Trans>Target Price:</Trans>
          </ExtentsText>
        </RangeText>
        <RangeText>
          <Trans>
            {commafy(priceUpper?.toSignificant(3))} <HoverInlineText text={currencyQuote?.symbol} /> {' per '}
            <HoverInlineText maxCharacters={10} text={currencyBase?.symbol} />{' '}
            <DollarValues>
              {targetPriceUSD && !isTokenStable ? <span>(${formatPrice(targetPriceUSD)})</span> : ''}{' '}
            </DollarValues>{' '}
          </Trans>
        </RangeText>
      </RowBetween>
    </LinkRow>
  )
}
