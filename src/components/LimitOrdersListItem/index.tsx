import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import { DateTime } from 'luxon/src/luxon'
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import Web3 from 'web3-utils'

import { DAI, USDC, USDT, WBTC, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { useToken } from '../../hooks/Tokens'
import useIsTickAtLimit from '../../hooks/useIsTickAtLimit'
import useLimitOrdersDates from '../../hooks/useLimitOrdersDates'
import { usePool } from '../../hooks/usePools'
import useUSDCPrice from '../../hooks/useUSDCPrice'
import { useV3PositionFromTokenId } from '../../hooks/useV3Positions'
import { TYPE } from '../../theme'
import { unwrappedToken } from '../../utils/unwrappedToken'
import { RowBetween } from '../Row'

const LimitOrderWrapper = styled(Link)`
  gap: 5px;
  padding: 0.5rem;
  color: inherit;
  text-decoration: none;
  border-radius: 20px;
  overflow: hidden;

  :hover {
    background-color: ${({ theme }) => theme.bg1};
  }
`

const RowFixedHeight = styled(RowBetween)`
  width: 100%;
  height: 24px;
`

const Token0 = styled(Text)`
  color: ${({ theme }) => theme.red1};
`

const Token1 = styled(Text)`
  color: ${({ theme }) => theme.green1};
`

const TextLabel = styled(Text)`
  word-break: keep-all;
  white-space: nowrap;
`

const TextValue = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
  flex: 1;
  padding-left: 1rem;
`

interface OrderDetails {
  owner: string
  tokenId: BigNumber
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: BigNumber
  processed: BigNumber
  tokensOwed0: BigNumber
  tokensOwed1: BigNumber
}

interface OrderListItemProps {
  limitOrderDetails: OrderDetails
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

function formatDate(date: Date) {
  return date.toLocaleTimeString('en-US', { hour12: false })
}

export default function LimitOrdersListItem({ limitOrderDetails, isUnderfunded }: OrderListItemProps) {
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
  } = limitOrderDetails

  const { createdLogs } = useV3PositionFromTokenId(limitOrderDetails.tokenId)
  const { createdBlockDate, processedBlockDate, cancelledBlockDate, collectedBlockDate } = useLimitOrdersDates(
    limitOrderDetails.tokenId
  )
  const positionSummaryLink = '/pool/' + limitOrderDetails.tokenId

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? token0 : undefined
  const currency1 = token1 ? token1 : undefined

  const token0CreatedAmount = createdLogs?.event?.amount0 ? Web3.fromWei(createdLogs?.event?.amount0.toString()) : ''
  const token1CreatedAmount = createdLogs?.event?.amount1 ? Web3.fromWei(createdLogs?.event?.amount1.toString()) : ''
  const token0CollectedAmount = tokensOwed0 ? Web3.fromWei(tokensOwed0.toString()) : ''
  const token1CollectedAmount = tokensOwed1 ? Web3.fromWei(tokensOwed1.toString()) : ''

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)
  const position = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)
  const { priceLower, priceUpper, quote, base } = getPriceOrderingFromPositionForUI(position)
  const currencyQuote = quote && unwrappedToken(quote)
  const currencyBase = base && unwrappedToken(base)

  const inverted = token1 ? base?.equals(token1) : undefined
  const isTokenStable = isToken0Stable(pool?.token0) ?? undefined

  // check if price is within range ; if out of range; the status is pending
  const outOfRange: boolean = pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false

  const currencyAmount = tokensOwed0.gt(0)
    ? currency0
      ? CurrencyAmount.fromRawAmount(currency0 as Token, tokensOwed0.toString())
      : undefined
    : currency1
    ? CurrencyAmount.fromRawAmount(currency1 as Token, tokensOwed1.toString())
    : undefined

  const currencyAmount1 = tokensOwed0.eq(0)
    ? currency0
      ? CurrencyAmount.fromRawAmount(currency0 as Token, tokensOwed0.toString())
      : undefined
    : currency1
    ? CurrencyAmount.fromRawAmount(currency1 as Token, tokensOwed1.toString())
    : undefined

  const currencyAmountFee = currencyAmount?.toFixed(6)

  const currencyAmountFee1 =
    currencyAmount?.currency.symbol == base?.symbol
      ? (Number(currencyAmount?.toSignificant(6)) * Number(priceUpper?.toSignificant(6))).toFixed(6)
      : (Number(currencyAmount?.toSignificant(6)) / Number(priceUpper?.toSignificant(6))).toFixed(6)

  const targetPrice = useMemo(() => {
    if (priceUpper?.baseCurrency != currencyAmount?.currency) {
      // invert
      return priceUpper?.invert()
    }
    return priceUpper
  }, [currencyAmount?.currency, priceUpper])

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

  const renderStatus = () => (processed ? 'Processed' : outOfRange ? 'Pending' : 'In Range')

  return (
    <LimitOrderWrapper to={positionSummaryLink}>
      <RowFixedHeight>
        <Token0>
          <Trans>{token0CreatedAmount} </Trans> <span>{currencyAmount?.currency.symbol}</span>
        </Token0>
        <Token1>
          <Trans>{currencyAmount1?.toSignificant(6)} </Trans> <span>{currencyAmount1?.currency.symbol}</span>
        </Token1>
      </RowFixedHeight>

      <RowFixedHeight>
        <TextLabel>
          <TYPE.darkGray>
            <Trans>Status:</Trans>
          </TYPE.darkGray>
        </TextLabel>
        <TextValue>
          <Trans>{renderStatus()}</Trans>
        </TextValue>
      </RowFixedHeight>

      {createdBlockDate && (
        <RowFixedHeight>
          <TextLabel>
            <TYPE.darkGray>
              <Trans>Opened:</Trans>
            </TYPE.darkGray>
          </TextLabel>
          <TextValue>
            <Trans>{createdBlockDate.toLocaleString(DateTime.DATETIME_FULL)}</Trans>
          </TextValue>
        </RowFixedHeight>
      )}

      {cancelledBlockDate && (
        <RowFixedHeight>
          <TextLabel>
            <TYPE.darkGray>
              <Trans>Cancelled:</Trans>
            </TYPE.darkGray>
          </TextLabel>
          <TextValue>
            <Trans>{cancelledBlockDate.toLocaleString(DateTime.DATETIME_FULL)}</Trans>
          </TextValue>
        </RowFixedHeight>
      )}

      {collectedBlockDate && (
        <RowFixedHeight>
          <TextLabel>
            <TYPE.darkGray>
              <Trans>Closed:</Trans>
            </TYPE.darkGray>
          </TextLabel>
          <TextValue>
            <Trans>{collectedBlockDate.toLocaleString(DateTime.DATETIME_FULL)}</Trans>
          </TextValue>
        </RowFixedHeight>
      )}

      <RowFixedHeight>
        <TextLabel>
          <TYPE.darkGray>
            <Trans>Limit price:</Trans>
          </TYPE.darkGray>
        </TextLabel>
        <TextValue>
          <Trans>
            {priceUpper ? (
              <>
                <span>1 {currencyAmount?.currency.symbol} = </span>
                <span>{commafy(priceUpper?.toSignificant(6))}</span>
                <span> {currencyAmount1?.currency.symbol}</span>{' '}
              </>
            ) : (
              ''
            )}
          </Trans>
        </TextValue>
      </RowFixedHeight>

      <RowFixedHeight>
        <TextLabel>
          <TYPE.darkGray>
            <Trans>Limit price (USD):</Trans>
          </TYPE.darkGray>
        </TextLabel>
        <TextValue>
          <Trans>{targetPriceUSD && !isTokenStable ? <span>(${formatPrice(targetPriceUSD)})</span> : ''}</Trans>
        </TextValue>
      </RowFixedHeight>

      <RowFixedHeight>
        <TextLabel>
          <TYPE.darkGray>
            <Trans>LP fees earned:</Trans>
          </TYPE.darkGray>
        </TextLabel>
        <TextValue>
          <Trans>
            {currencyAmountFee + ' ' + currency0?.symbol} + {currencyAmountFee1 + ' ' + currency1?.symbol}
          </Trans>
        </TextValue>
      </RowFixedHeight>
    </LimitOrderWrapper>
  )
}
