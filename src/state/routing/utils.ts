import { BigNumber } from '@ethersproject/bignumber'
import { MixedRouteSDK } from '@kinetix/router-sdk'
import { ChainId, Currency, CurrencyAmount, Percent, Token, TradeType } from '@kinetix/sdk-core'
import { AlphaRouter } from '@kinetix/smart-order-router'
import { Pair, Route as V2Route } from '@kinetix/v2-sdk'
import { FeeAmount, Pool, Route as V3Route } from '@kinetix/v3-sdk'
import { DutchOrderInfo, DutchOrderInfoJSON } from '@uniswap/uniswapx-sdk'
import { nativeOnChain } from 'constants/tokens'
import { getCoingeckoPriceCache } from 'hooks/useUSDPrice'

import { getApproveInfo } from './gas'
import {
  ClassicQuoteData,
  ClassicTrade,
  DutchOrderTrade,
  GetQuoteArgs,
  InterfaceTrade,
  OpenOceanQuoteResponse,
  PoolType,
  QuoteMethod,
  QuoteState,
  RouterPreference,
  SwapRouterNativeAssets,
  TradeFillType,
  TradeResult,
  V2PoolInRoute,
  V3PoolInRoute,
} from './types'

interface RouteResult {
  routev3: V3Route<Currency, Currency> | null
  routev2: V2Route<Currency, Currency> | null
  mixedRoute: MixedRouteSDK<Currency, Currency> | null
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
}

const routers = new Map<ChainId, AlphaRouter>()
// export function getRouter(chainId: ChainId): AlphaRouter {
//   const router = routers.get(chainId)
//   if (router) return router

//   const supportedChainId = asSupportedChain(chainId)
//   if (supportedChainId) {
//     const provider = RPC_PROVIDERS[supportedChainId]
//     const router = new AlphaRouter({ chainId, provider })
//     routers.set(chainId, router)
//     return router
//   }

//   throw new Error(`Router does not support this chain (chainId: ${chainId}).`)
// }

/**
 * Transforms a Routing API quote into an array of routes that can be used to
 * create a `Trade`.
 */
// function computeRoutes(currencyIn: Currency, currencyOut: Currency, routes: Array<Route>): RouteResult[] | undefined {
//   if (routes.length === 0) return []

//   const tokenIn = routes[0]?.subRoutes[0]?.from
//   const tokenOut = routes[0]?.subRoutes[routes[0]?.subRoutes.length - 1]?.to
//   if (!tokenIn || !tokenOut) throw new Error('Expected both tokenIn and tokenOut to be present')

//   try {
//     return routes.map((route) => {
//       if (routes.length === 0) {
//         throw new Error('Expected route to have at least one pair or pool')
//       }
//       const rawAmountIn = route[0].amountIn
//       const rawAmountOut = route[route.length - 1].amountOut

//       if (!rawAmountIn || !rawAmountOut) {
//         throw new Error('Expected both amountIn and amountOut to be present')
//       }

//       const isOnlyV2 = isVersionedRoute<V2PoolInRoute>(PoolType.V2Pool, route)
//       const isOnlyV3 = isVersionedRoute<V3PoolInRoute>(PoolType.V3Pool, route)

//       return {
//         routev3: isOnlyV3 ? new V3Route(route.map(parsePool), currencyIn, currencyOut) : null,
//         routev2: isOnlyV2 ? new V2Route(route.map(parsePair), currencyIn, currencyOut) : null,
//         mixedRoute:
//           !isOnlyV3 && !isOnlyV2 ? new MixedRouteSDK(route.map(parsePoolOrPair), currencyIn, currencyOut) : null,
//         inputAmount: CurrencyAmount.fromRawAmount(currencyIn, rawAmountIn),
//         outputAmount: CurrencyAmount.fromRawAmount(currencyOut, rawAmountOut),
//       }
//     })
//   } catch (e) {
//     console.error('Error computing routes', e)
//     return
//   }
// }

const parsePoolOrPair = (pool: V3PoolInRoute | V2PoolInRoute): Pool | Pair => {
  return pool.type === PoolType.V3Pool ? parsePool(pool) : parsePair(pool)
}

function isVersionedRoute<T extends V2PoolInRoute | V3PoolInRoute>(
  type: T['type'],
  route: (V3PoolInRoute | V2PoolInRoute)[]
): route is T[] {
  return route.every((pool) => pool.type === type)
}

function toDutchOrderInfo(orderInfoJSON: DutchOrderInfoJSON): DutchOrderInfo {
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

// Prepares the currencies used for the actual Swap (either UniswapX or Universal Router)
// May not match `currencyIn` that the user selected because for ETH inputs in UniswapX, the actual
// swap will use WETH.
function getTradeCurrencies(args: GetQuoteArgs): [Currency, Currency] {
  const {
    tokenInAddress,
    tokenInChainId,
    tokenInDecimals,
    tokenInSymbol,
    tokenOutAddress,
    tokenOutChainId,
    tokenOutDecimals,
    tokenOutSymbol,
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

  return [currencyIn, currencyOut]
}

function getClassicTradeDetails(
  currencyIn: Currency,
  currencyOut: Currency,
  data: OpenOceanQuoteResponse
): {
  gasUseEstimate?: number
  gasUseEstimateUSD?: number
  blockNumber?: string
  routes?: RouteResult[]
} {
  const classicQuote = data.data
  return {
    gasUseEstimate: classicQuote?.estimatedGas ? parseFloat(classicQuote.estimatedGas) : undefined,
    gasUseEstimateUSD: undefined,
    blockNumber: undefined,
    routes: undefined,
  }
}

export async function transformRoutesToTrade(
  args: GetQuoteArgs,
  data: OpenOceanQuoteResponse,
  quoteMethod: QuoteMethod
): Promise<TradeResult> {
  const { tradeType, account, amount } = args
  const { inAmount, outAmount, inToken, outToken } = data.data

  const [currencyIn, currencyOut] = getTradeCurrencies(args)
  const { gasUseEstimateUSD, blockNumber, routes, gasUseEstimate } = getClassicTradeDetails(
    currencyIn,
    currencyOut,
    data
  )

  const tokenIn = parseToken({
    address: inToken.address,
    chainId: ChainId.KAVA,
    decimals: inToken.decimals,
    symbol: inToken.symbol,
  })
  const tokenOut = parseToken({
    address: outToken.address,
    chainId: ChainId.KAVA,
    decimals: outToken.decimals,
    symbol: outToken.symbol,
  })

  // Some sus javascript float math but it's ok because its just an estimate for display purposes
  const usdCostPerGas = gasUseEstimateUSD && gasUseEstimate ? gasUseEstimateUSD / gasUseEstimate : undefined

  const approveInfo = await getApproveInfo(account, currencyIn, amount, usdCostPerGas)
  console.log('currencyIn', currencyIn, currencyOut)
  const inTokenPricePrev = getCoingeckoPriceCache(inToken.symbol)
  console.log('inTokenDefaultPrice', inTokenPricePrev)
  const currencyAmountIn = CurrencyAmount.fromRawAmount(currencyIn, inAmount)
  const currencyAmountOut = CurrencyAmount.fromRawAmount(currencyOut, outAmount)
  if (inTokenPricePrev) {
    const currencyAmountInPrev = CurrencyAmount.fromRawAmount(currencyIn, inTokenPricePrev)
  }

  const classicTrade = new ClassicTrade({
    tradeType,
    gasUseEstimateUSD,
    approveInfo,
    blockNumber,
    isUniswapXBetter: false,
    requestId: undefined,
    quoteMethod,
    inputAmount: currencyAmountIn,
    outputAmount: currencyAmountOut,
    // inputAmount: CurrencyAmount.fromFractionalAmount(tokenIn, currencyAmountIn.numerator, currencyAmountIn.denominator),
    // outputAmount: CurrencyAmount.fromFractionalAmount(
    //   tokenOut,
    //   currencyAmountOut.numerator,
    //   currencyAmountOut.denominator
    // ),
    priceImpact: new Percent(10, 100),
  })

  // outAmount * (1 - this.tolerance / 100), 8, 4)
  console.log('classictrade', classicTrade)

  return { state: QuoteState.SUCCESS, trade: classicTrade }
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
    return SwapRouterNativeAssets.ETH
  }

  return currency.address
}

export function isClassicTrade(trade?: InterfaceTrade): trade is ClassicTrade {
  return trade?.fillType === TradeFillType.Classic
}

export function isUniswapXTrade(trade?: InterfaceTrade): trade is DutchOrderTrade {
  return trade?.fillType === TradeFillType.UniswapX
}

export function shouldUseAPIRouter(args: GetQuoteArgs): boolean {
  return args.routerPreference !== RouterPreference.CLIENT
}

export function getTransactionCount(trade: InterfaceTrade): number {
  let count = 0
  if (trade.approveInfo.needsApprove) {
    count++ // approval step, which can happen in both classic and uniswapx
  }
  if (isUniswapXTrade(trade)) {
    if (trade.wrapInfo.needsWrap) {
      count++ // wrapping step for uniswapx
    }
  } else {
    count++ // classic onchain swap
  }
  return count
}
