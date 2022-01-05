import { Currency, CurrencyAmount, Ether, Token, TradeType } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import { Trade } from 'src/features/swap/useTrade'
import { QuoteResult, V2PoolInRoute, V3PoolInRoute } from '../prices/types'

export function transformQuoteToTrade(
  currencyIn: Currency | null | undefined,
  currencyOut: Currency | null | undefined,
  tradeType: TradeType,
  quoteResult: QuoteResult | undefined
): Trade {
  const routes = computeRoutes(currencyIn, currencyOut, tradeType, quoteResult)

  return new Trade({
    quote: quoteResult,
    v2Routes:
      routes
        ?.filter((r) => r.routev2 !== null)
        .map(({ routev2, inputAmount, outputAmount }) => ({
          routev2: routev2!,
          inputAmount,
          outputAmount,
        })) ?? [],
    v3Routes:
      routes
        ?.filter((r) => r.routev3 !== null)
        .map(({ routev3, inputAmount, outputAmount }) => ({
          routev3: routev3!,
          inputAmount,
          outputAmount,
        })) ?? [],
    tradeType,
  })
}

/**
 * Transforms a Routing API quote into an array of routes that can be used to
 * create a `Trade`.
 */
export function computeRoutes(
  currencyIn: Currency | null | undefined,
  currencyOut: Currency | null | undefined,
  tradeType: TradeType,
  quoteResult: Pick<QuoteResult, 'route'> | undefined
) {
  if (!quoteResult || !quoteResult.route || !currencyIn || !currencyOut) return undefined

  if (quoteResult.route.length === 0) return []

  const parsedCurrencyIn = currencyIn.isNative
    ? Ether.onChain(currencyIn.chainId)
    : parseToken(quoteResult.route[0][0].tokenIn)

  const parsedCurrencyOut = currencyOut.isNative
    ? Ether.onChain(currencyOut.chainId)
    : parseToken(quoteResult.route[0][quoteResult.route[0].length - 1].tokenOut)

  try {
    return quoteResult.route.map((route) => {
      if (route.length === 0) {
        throw new Error('Expected route to have at least one pair or pool')
      }
      const rawAmountIn = route[0].amountIn
      const rawAmountOut = route[route.length - 1].amountOut

      if (!rawAmountIn || !rawAmountOut) {
        throw new Error('Expected both amountIn and amountOut to be present')
      }

      return {
        routev3: isV3Route(route)
          ? new V3Route(route.map(parsePool), parsedCurrencyIn, parsedCurrencyOut)
          : null,
        routev2: !isV3Route(route)
          ? new V2Route(route.map(parsePair), parsedCurrencyIn, parsedCurrencyOut)
          : null,
        inputAmount: CurrencyAmount.fromRawAmount(parsedCurrencyIn, rawAmountIn),
        outputAmount: CurrencyAmount.fromRawAmount(parsedCurrencyOut, rawAmountOut),
      }
    })
  } catch (e) {
    return undefined
  }
}

const parseToken = ({
  address,
  chainId,
  decimals,
  symbol,
}: QuoteResult['route'][0][0]['tokenIn']): Token => {
  return new Token(chainId, address, parseInt(decimals.toString(), 10), symbol)
}

const parsePool = ({
  fee,
  sqrtRatioX96,
  liquidity,
  tickCurrent,
  tokenIn,
  tokenOut,
}: V3PoolInRoute): Pool =>
  new Pool(
    parseToken(tokenIn),
    parseToken(tokenOut),
    parseInt(fee, 10) as FeeAmount,
    sqrtRatioX96,
    liquidity,
    parseInt(tickCurrent, 10)
  )

const parsePair = ({ reserve0, reserve1 }: V2PoolInRoute): Pair =>
  new Pair(
    CurrencyAmount.fromRawAmount(parseToken(reserve0.token), reserve0.quotient),
    CurrencyAmount.fromRawAmount(parseToken(reserve1.token), reserve1.quotient)
  )

function isV3Route(route: V3PoolInRoute[] | V2PoolInRoute[]): route is V3PoolInRoute[] {
  return route[0].type === 'v3-pool'
}
