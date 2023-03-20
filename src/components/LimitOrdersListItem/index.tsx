import { BigNumber } from '@ethersproject/bignumber'
// eslint-disable-next-line no-restricted-imports
import { Trans } from '@lingui/macro'
import { CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { DateTime } from 'luxon/src/luxon'
import { memo, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

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

const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))
const Q192 = JSBI.exponentiate(Q96, JSBI.BigInt(2))

const LimitOrderWrapper = styled(Link)`
  gap: 5px;
  padding: 0.5rem;
  color: inherit;
  text-decoration: none;
  border-radius: 20px;
  overflow: hidden;

  :hover {
    background-color: ${({ theme }) => theme.bg6};
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
  font-size: 14px;
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

function LimitOrdersListItem({ limitOrderDetails }: OrderListItemProps) {
  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
    tokenId,
    processed,
    tokensOwed0,
    tokensOwed1,
    owner,
  } = limitOrderDetails || {}

  const positionSummaryLink = '/pool/' + tokenId

  const { createdLogs, collectedLogs } = useV3PositionFromTokenId(tokenId)
  const { event: createdEvent } = createdLogs || {}
  const { event: collectedEvent } = collectedLogs || {}
  const { createdBlockDate, cancelledBlockDate, collectedBlockDate } = useLimitOrdersDates(limitOrderDetails.tokenId)

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined
  const currency0Wrapped = token0 ? token0 : undefined
  const currency1Wrapped = token1 ? token1 : undefined

  const currencyAmount0: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!tokensOwed0 || !currency0) return undefined
    return CurrencyAmount.fromRawAmount(currency0 as Token, tokensOwed0?.toString())
  }, [currency0, tokensOwed0])
  const currencyAmount1: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!tokensOwed1 || !currency1) return undefined
    return CurrencyAmount.fromRawAmount(currency1 as Token, tokensOwed1?.toString())
  }, [currency1, tokensOwed1])

  const createdEventAmount0 = createdEvent?.amount0
  const createdEventAmount1 = createdEvent?.amount1
  const createdValue0: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!createdEventAmount0 || !currency0) return undefined
    return CurrencyAmount.fromRawAmount(currency0 as Token, createdEventAmount0?.toString())
  }, [createdEventAmount0, currency0])
  const createdValue1: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!createdEventAmount1 || !currency1) return undefined
    return CurrencyAmount.fromRawAmount(currency1 as Token, createdEventAmount1?.toString())
  }, [createdEventAmount1, currency1])

  const currencyCreatedEventAmount: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!createdEventAmount0 || !currency0Wrapped) return undefined
    if (!createdEventAmount1 || !currency1Wrapped) return undefined
    if (createdEventAmount0.gt(createdEventAmount1)) {
      return CurrencyAmount.fromRawAmount(currency0Wrapped as Token, createdEventAmount0?.toString())
    }
    return CurrencyAmount.fromRawAmount(currency1Wrapped as Token, createdEventAmount1?.toString())
  }, [createdEventAmount0, currency0Wrapped, createdEventAmount1, currency1Wrapped])

  const collectedAmount0 = collectedEvent?.tokensOwed0
  const collectedAmount1 = collectedEvent?.tokensOwed1
  const collectedValue0: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!collectedAmount0 || !currency0) return undefined
    return CurrencyAmount.fromRawAmount(currency0 as Token, collectedAmount0?.toString())
  }, [collectedAmount0, currency0])
  const collectedValue1: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!collectedAmount1 || !currency1) return undefined
    return CurrencyAmount.fromRawAmount(currency1 as Token, collectedAmount1?.toString())
  }, [collectedAmount1, currency1])

  const token0USD = useUSDCPrice(currency0 ?? undefined)?.toSignificant(6)
  const token1USD = useUSDCPrice(currency1 ?? undefined)?.toSignificant(6)

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)
  const position = useMemo(() => {
    if (pool && liquidity && typeof tickLower === 'number' && typeof tickUpper === 'number') {
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

  const sqrtRatioX96Recalc = createdEvent?.sqrtPriceX96

  const createdPrice = useMemo(() => {
    if (!currency0Wrapped || !currency1Wrapped || !sqrtRatioX96Recalc) return undefined
    const ratioX192 = JSBI.multiply(JSBI.BigInt(sqrtRatioX96Recalc), JSBI.BigInt(sqrtRatioX96Recalc))
    return new Price(currency0Wrapped, currency1Wrapped, Q192, ratioX192)
  }, [currency0Wrapped, currency1Wrapped, sqrtRatioX96Recalc])

  // TODO (pai) fix the target price ; upper or lower ; buy or sell
  const targetPrice = useMemo(() => {
    if (createdPrice) {
      if (createdPrice?.baseCurrency != currencyCreatedEventAmount?.currency) {
        return createdPrice.invert()
      }
      return createdPrice
    }
    if (priceUpper?.baseCurrency != currencyCreatedEventAmount?.currency) {
      // invert
      return priceUpper?.invert()
    }
    return priceUpper
  }, [createdPrice, currencyCreatedEventAmount, priceUpper])

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

  // check if price is within range
  const below = pool && typeof tickLower === 'number' ? pool.tickCurrent < tickLower : undefined
  const above = pool && typeof tickUpper === 'number' ? pool.tickCurrent >= tickUpper : undefined
  const inRange: boolean = typeof below === 'boolean' && typeof above === 'boolean' ? !below && !above : false

  return (
    <LimitOrderWrapper to={positionSummaryLink}>
      <RowFixedHeight>
        <Token0>
          <Trans>{`${commafy(currencyCreatedEventAmount?.toSignificant())} ${
            currencyCreatedEventAmount?.currency ? unwrappedToken(currencyCreatedEventAmount?.currency)?.symbol : ''
          }`}</Trans>
        </Token0>
        <Token1>
          <Trans>
            {targetPrice && currencyCreatedEventAmount
              ? `${commafy(targetPrice?.quote(currencyCreatedEventAmount).toSignificant())} ${
                  targetPrice?.quoteCurrency ? unwrappedToken(targetPrice?.quoteCurrency)?.symbol : ''
                }`
              : ''}
          </Trans>
        </Token1>
      </RowFixedHeight>
      <RowFixedHeight>
        <TextLabel>
          <TYPE.darkGray>
            <Trans>Status:</Trans>
          </TYPE.darkGray>
        </TextLabel>
        <TextValue fontWeight={700}>
          {processed ? <Trans>Processed</Trans> : inRange ? <Trans>In Range</Trans> : <Trans>Pending</Trans>}
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
            {targetPrice ? (
              <>
                <span>1 {currencyAmount0?.currency.symbol} = </span>
                <span>{commafy(targetPrice?.toSignificant(6))}</span>
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
          <Trans>{targetPriceUSD && !isTokenStable ? <span>${formatPrice(targetPriceUSD)}</span> : ''}</Trans>
        </TextValue>
      </RowFixedHeight>
      <RowFixedHeight>
        <TextLabel>
          <TYPE.darkGray>
            <Trans>Collected:</Trans>
          </TYPE.darkGray>
        </TextLabel>
        <TextValue>
          <Trans>
            {`${commafy(collectedValue0?.toSignificant())} ${currency0?.symbol} + 
              ${commafy(collectedValue1?.toSignificant())} ${currency1?.symbol}`}
          </Trans>
        </TextValue>
      </RowFixedHeight>
    </LimitOrderWrapper>
  )
}

const MemoizedLimitOrdersListItem = memo(
  LimitOrdersListItem,
  (prevProps, nextProps) =>
    prevProps.limitOrderDetails.owner === nextProps.limitOrderDetails.owner &&
    prevProps.limitOrderDetails.tokenId === nextProps.limitOrderDetails.tokenId &&
    prevProps.limitOrderDetails.token0 === nextProps.limitOrderDetails.token0 &&
    prevProps.limitOrderDetails.token1 === nextProps.limitOrderDetails.token1 &&
    prevProps.limitOrderDetails.fee === nextProps.limitOrderDetails.fee &&
    prevProps.limitOrderDetails.processed === nextProps.limitOrderDetails.processed &&
    prevProps.limitOrderDetails.tokensOwed0 === nextProps.limitOrderDetails.tokensOwed0 &&
    prevProps.limitOrderDetails.tokensOwed1 === nextProps.limitOrderDetails.tokensOwed1
)

export { MemoizedLimitOrdersListItem as default }
