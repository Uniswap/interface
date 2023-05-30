import { BigNumber } from '@ethersproject/bignumber'
import { DutchLimitOrderInfo, DutchLimitOrderInfoJSON } from '@uniswap/gouda-sdk'
import { MixedRouteSDK } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Pair, Route as V2Route } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import { isPolygonChain } from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'

import { GetQuoteArgs } from './slice'
import {
  ClassicQuoteData,
  ClassicTrade,
  DutchLimitOrderTrade,
  InterfaceTrade,
  PoolType,
  QuoteState,
  SwapRouterNativeAssets,
  TradeFillType,
  TradeResult,
  URAQuoteResponse,
  URAQuoteType,
  V2PoolInRoute,
  V3PoolInRoute,
} from './types'

/**
 * Transforms a Routing API quote into an array of routes that can be used to
 * create a `Trade`.
 */
export function computeRoutes(
  tokenInIsNative: boolean,
  tokenOutIsNative: boolean,
  routes: ClassicQuoteData['route']
):
  | {
      routev3: V3Route<Currency, Currency> | null
      routev2: V2Route<Currency, Currency> | null
      mixedRoute: MixedRouteSDK<Currency, Currency> | null
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
  | undefined {
  if (routes.length === 0) return []

  const tokenIn = routes[0]?.[0]?.tokenIn
  const tokenOut = routes[0]?.[routes[0]?.length - 1]?.tokenOut
  if (!tokenIn || !tokenOut) throw new Error('Expected both tokenIn and tokenOut to be present')

  const parsedCurrencyIn = tokenInIsNative ? nativeOnChain(tokenIn.chainId) : parseToken(tokenIn)
  const parsedCurrencyOut = tokenOutIsNative ? nativeOnChain(tokenOut.chainId) : parseToken(tokenOut)

  try {
    return routes.map((route) => {
      if (route.length === 0) {
        throw new Error('Expected route to have at least one pair or pool')
      }
      const rawAmountIn = route[0].amountIn
      const rawAmountOut = route[route.length - 1].amountOut

      if (!rawAmountIn || !rawAmountOut) {
        throw new Error('Expected both amountIn and amountOut to be present')
      }

      const isOnlyV2 = isVersionedRoute<V2PoolInRoute>(PoolType.V2Pool, route)
      const isOnlyV3 = isVersionedRoute<V3PoolInRoute>(PoolType.V3Pool, route)

      return {
        routev3: isOnlyV3 ? new V3Route(route.map(parsePool), parsedCurrencyIn, parsedCurrencyOut) : null,
        routev2: isOnlyV2 ? new V2Route(route.map(parsePair), parsedCurrencyIn, parsedCurrencyOut) : null,
        mixedRoute:
          !isOnlyV3 && !isOnlyV2
            ? new MixedRouteSDK(route.map(parsePoolOrPair), parsedCurrencyIn, parsedCurrencyOut)
            : null,
        inputAmount: CurrencyAmount.fromRawAmount(parsedCurrencyIn, rawAmountIn),
        outputAmount: CurrencyAmount.fromRawAmount(parsedCurrencyOut, rawAmountOut),
      }
    })
  } catch (e) {
    console.error('Error computing routes', e)
    return
  }
}

const parsePoolOrPair = (pool: V3PoolInRoute | V2PoolInRoute): Pool | Pair => {
  return pool.type === PoolType.V3Pool ? parsePool(pool) : parsePair(pool)
}

function isVersionedRoute<T extends V2PoolInRoute | V3PoolInRoute>(
  type: T['type'],
  route: (V3PoolInRoute | V2PoolInRoute)[]
): route is T[] {
  return route.every((pool) => pool.type === type)
}

function toDutchLimitOrderInfo(orderInfoJSON: DutchLimitOrderInfoJSON): DutchLimitOrderInfo {
  const { nonce, input, outputs, exclusivityOverrideBps } = orderInfoJSON
  return {
    ...orderInfoJSON,
    nonce: BigNumber.from(nonce),
    exclusivityOverrideBps: BigNumber.from(exclusivityOverrideBps),
    input: {
      ...input,
      startAmount: BigNumber.from(input.startAmount),
      endAmount: BigNumber.from(input.endAmount),
    },
    outputs: outputs.map((output) => ({
      ...output,
      startAmount: BigNumber.from(output.startAmount),
      endAmount: BigNumber.from(output.endAmount),
    })),
  }
}

export function transformRoutesToTrade(args: GetQuoteArgs, data: URAQuoteResponse): TradeResult {
  const {
    tokenInAddress,
    tokenInChainId,
    tokenInDecimals,
    tokenInSymbol,
    tokenOutAddress,
    tokenOutChainId,
    tokenOutDecimals,
    tokenOutSymbol,
    tradeType,
  } = args

  const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(tokenInAddress as SwapRouterNativeAssets)
  const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(tokenOutAddress as SwapRouterNativeAssets)

  const currencyIn = tokenInIsNative
    ? nativeOnChain(tokenInChainId)
    : parseToken({ address: tokenInAddress, chainId: tokenInChainId, decimals: tokenInDecimals, symbol: tokenInSymbol })
  const currencyOut = tokenOutIsNative
    ? nativeOnChain(tokenOutChainId)
    : parseToken({
        address: tokenOutAddress,
        chainId: tokenOutChainId,
        decimals: tokenOutDecimals,
        symbol: tokenOutSymbol,
      })

  if (data.routing === URAQuoteType.DUTCH_LIMIT) {
    const orderInfo = toDutchLimitOrderInfo(data.quote)
    return {
      state: QuoteState.SUCCESS,
      trade: new DutchLimitOrderTrade({
        currencyIn,
        currenciesOut: [currencyOut],
        orderInfo,
        tradeType,
        quoteId: data.quote.quoteId,
        // TODO (Gouda): fix this value for ETH input flow
        needsWrap: false,
      }),
    }
  }

  const { gasUseEstimateUSD, blockNumber } = data.quote
  const routes = computeRoutes(tokenInIsNative, tokenOutIsNative, data.quote.route)

  const trade = new ClassicTrade({
    v2Routes:
      routes
        ?.filter(
          (r): r is typeof routes[0] & { routev2: NonNullable<typeof routes[0]['routev2']> } => r.routev2 !== null
        )
        .map(({ routev2, inputAmount, outputAmount }) => ({
          routev2,
          inputAmount,
          outputAmount,
        })) ?? [],
    v3Routes:
      routes
        ?.filter(
          (r): r is typeof routes[0] & { routev3: NonNullable<typeof routes[0]['routev3']> } => r.routev3 !== null
        )
        .map(({ routev3, inputAmount, outputAmount }) => ({
          routev3,
          inputAmount,
          outputAmount,
        })) ?? [],
    mixedRoutes:
      routes
        ?.filter(
          (r): r is typeof routes[0] & { mixedRoute: NonNullable<typeof routes[0]['mixedRoute']> } =>
            r.mixedRoute !== null
        )
        .map(({ mixedRoute, inputAmount, outputAmount }) => ({
          mixedRoute,
          inputAmount,
          outputAmount,
        })) ?? [],
    tradeType,
    gasUseEstimateUSD: parseFloat(gasUseEstimateUSD).toFixed(2).toString(),
    blockNumber,
  })

  return { state: QuoteState.SUCCESS, trade }
}

function parseToken({ address, chainId, decimals, symbol }: ClassicQuoteData['route'][0][0]['tokenIn']): Token {
  return new Token(chainId, address, parseInt(decimals.toString()), symbol)
}

function parsePool({ fee, sqrtRatioX96, liquidity, tickCurrent, tokenIn, tokenOut }: V3PoolInRoute): Pool {
  return new Pool(
    parseToken(tokenIn),
    parseToken(tokenOut),
    parseInt(fee) as FeeAmount,
    sqrtRatioX96,
    liquidity,
    parseInt(tickCurrent)
  )
}

const parsePair = ({ reserve0, reserve1 }: V2PoolInRoute): Pair =>
  new Pair(
    CurrencyAmount.fromRawAmount(parseToken(reserve0.token), reserve0.quotient),
    CurrencyAmount.fromRawAmount(parseToken(reserve1.token), reserve1.quotient)
  )

// TODO(WEB-2050): Convert other instances of tradeType comparison to use this utility function
export function isExactInput(tradeType: TradeType): boolean {
  return tradeType === TradeType.EXACT_INPUT
}

export function currencyAddressForSwapQuote(currency: Currency): string {
  if (currency.isNative) {
    return isPolygonChain(currency.chainId) ? SwapRouterNativeAssets.MATIC : SwapRouterNativeAssets.ETH
  }

  return currency.address
}

export function isClassicTrade(trade?: InterfaceTrade): trade is ClassicTrade {
  return trade?.fillType === TradeFillType.Classic
}

export function isUniswapXTrade(trade?: InterfaceTrade): trade is DutchLimitOrderTrade {
  return trade?.fillType === TradeFillType.UniswapX
}
