import { MixedRouteSDK } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import { BigNumber } from 'ethers'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'wallet/src/constants/transactions'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import {
  PoolType,
  QuoteResult,
  V2PoolInRoute,
  V3PoolInRoute,
} from 'wallet/src/features/transactions/swap/trade/legacy/types'
import { SwapFee, Trade } from 'wallet/src/features/transactions/swap/trade/types'
import { QuoteType } from 'wallet/src/features/transactions/utils'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

export function transformQuoteToTrade(
  tokenInIsNative: boolean,
  tokenOutIsNative: boolean,
  tradeType: TradeType,
  deadline: number,
  slippageTolerance: number | undefined,
  quoteResult: QuoteResult | undefined
): Trade | null {
  const routes = computeRoutes(tokenInIsNative, tokenOutIsNative, quoteResult)

  if (!routes) {
    return null
  }

  const swapFee: SwapFee | undefined =
    quoteResult?.portionAmount !== undefined && quoteResult?.portionBips !== undefined
      ? {
          recipient: quoteResult.portionRecipient,
          percent: new Percent(quoteResult.portionBips, '10000'),
          amount: quoteResult.portionAmount,
        }
      : undefined

  return new Trade({
    quoteData: { quote: quoteResult, quoteType: QuoteType.RoutingApi },
    deadline,
    slippageTolerance: slippageTolerance ?? MAX_AUTO_SLIPPAGE_TOLERANCE,
    v2Routes:
      routes
        ?.filter((r) => r.routev2 !== null)
        .map(({ routev2, inputAmount, outputAmount }) => ({
          // should figure out how to properly type the inner route type
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          routev2: routev2!,
          inputAmount,
          outputAmount,
        })) ?? [],
    v3Routes:
      routes
        ?.filter((r) => r.routev3 !== null)
        .map(({ routev3, inputAmount, outputAmount }) => ({
          // should figure out how to properly type the inner route type
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          routev3: routev3!,
          inputAmount,
          outputAmount,
        })) ?? [],
    mixedRoutes:
      routes
        ?.filter((r) => r.mixedRoute !== null)
        .map(({ mixedRoute, inputAmount, outputAmount }) => ({
          // should figure out how to properly type the inner route type
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          mixedRoute: mixedRoute!,
          inputAmount,
          outputAmount,
        })) ?? [],
    tradeType,
    swapFee,
  })
}

/**
 * Transforms a Routing API quote into an array of routes that can be used to
 * create a `Trade`.
 */
export function computeRoutes(
  tokenInIsNative: boolean,
  tokenOutIsNative: boolean,
  quoteResult?: Pick<QuoteResult, 'route'>
):
  | {
      routev3: V3Route<Currency, Currency> | null
      routev2: V2Route<Currency, Currency> | null
      mixedRoute: MixedRouteSDK<Currency, Currency> | null
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
  | undefined {
  if (!quoteResult || !quoteResult.route) {
    return
  }

  if (quoteResult.route.length === 0) {
    return
  }

  const tokenIn = quoteResult.route[0]?.[0]?.tokenIn
  const tokenOut = quoteResult.route[0]?.[quoteResult.route[0]?.length - 1]?.tokenOut

  if (!tokenIn || !tokenOut) {
    throw new Error('Expected both tokenIn and tokenOut to be present')
  }

  const parsedCurrencyIn = tokenInIsNative
    ? NativeCurrency.onChain(tokenIn.chainId)
    : parseToken(tokenIn)

  const parsedCurrencyOut = tokenOutIsNative
    ? NativeCurrency.onChain(tokenOut.chainId)
    : parseToken(tokenOut)

  try {
    return quoteResult.route.map((route) => {
      if (route.length === 0) {
        throw new Error('Expected route to have at least one pair or pool')
      }

      const inputAmount = getCurrencyAmount({
        value: route[0]?.amountIn,
        valueType: ValueType.Raw,
        currency: parsedCurrencyIn,
      })

      const outputAmount = getCurrencyAmount({
        value: route[route.length - 1]?.amountOut,
        valueType: ValueType.Raw,
        currency: parsedCurrencyOut,
      })

      if (!inputAmount || !outputAmount) {
        throw new Error('Expected both amountIn and amountOut to be present')
      }

      const isOnlyV2 = isV2OnlyRoute(route)
      const isOnlyV3 = isV3OnlyRoute(route)

      return {
        routev3: isOnlyV3
          ? new V3Route(route.map(parsePool), parsedCurrencyIn, parsedCurrencyOut)
          : null,
        routev2: isOnlyV2
          ? new V2Route(route.map(parsePair), parsedCurrencyIn, parsedCurrencyOut)
          : null,
        mixedRoute:
          !isOnlyV3 && !isOnlyV2
            ? new MixedRouteSDK(route.map(parsePoolOrPair), parsedCurrencyIn, parsedCurrencyOut)
            : null,
        inputAmount,
        outputAmount,
      }
    })
  } catch (e) {
    return
  }
}

const parseToken = ({
  address,
  chainId,
  decimals,
  symbol,
  name,
  buyFeeBps,
  sellFeeBps,
}: QuoteResult['route'][0][0]['tokenIn']): Token => {
  return new Token(
    chainId,
    address,
    parseInt(decimals.toString(), 10),
    symbol,
    name,
    false,
    buyFeeBps ? BigNumber.from(buyFeeBps) : undefined,
    sellFeeBps ? BigNumber.from(sellFeeBps) : undefined
  )
}

const parsePoolOrPair = (pool: V3PoolInRoute | V2PoolInRoute): Pool | Pair => {
  return pool.type === PoolType.V3Pool ? parsePool(pool) : parsePair(pool)
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

function isV2OnlyRoute(route: (V3PoolInRoute | V2PoolInRoute)[]): route is V2PoolInRoute[] {
  return route.every((pool) => pool.type === PoolType.V2Pool)
}

function isV3OnlyRoute(route: (V3PoolInRoute | V2PoolInRoute)[]): route is V3PoolInRoute[] {
  return route.every((pool) => pool.type === PoolType.V3Pool)
}
