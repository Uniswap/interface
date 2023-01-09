import { Interface } from '@ethersproject/abi'
import {
  ADDRESS_THIS,
  encodeMixedRouteToPath,
  getOutputOfPools,
  MixedRoute,
  MixedRouteSDK,
  MixedRouteTrade,
  MSG_SENDER,
  MulticallExtended,
  partitionMixedRouteByProtocol,
  PaymentsExtended,
  Protocol,
  RouteV2,
  RouteV3,
  SwapOptions,
  ZERO,
} from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, TradeType, validateAndParseAddress } from '@uniswap/sdk-core'
import { abi } from '@uniswap/swap-router-contracts/artifacts/contracts/interfaces/ISwapRouter02.sol/ISwapRouter02.json'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { encodeRouteToPath, MethodParameters, Payments, Pool, SelfPermit, toHex } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'

import { FloodTrade } from './trade'
import { V3FloodTrade } from './v3trade'

type AnyFloodTradeType =
  | FloodTrade<Currency, Currency, TradeType>
  | V2Trade<Currency, Currency, TradeType>
  | V3FloodTrade<Currency, Currency, TradeType>
  | MixedRouteTrade<Currency, Currency, TradeType>

const REFUND_ETH_PRICE_IMPACT_THRESHOLD = new Percent(JSBI.BigInt(50), JSBI.BigInt(100))
/**
 * Fork of SwapRouter from @uniswap/router-sdk, to support FloodTrade
 * Represents the Uniswap V2 + V3 SwapRouter02, and has static methods for helping execute trades.
 */
export abstract class SwapRouterFlood {
  public static INTERFACE: Interface = new Interface(abi)

  /**
   * Cannot be constructed.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * @notice Generates the calldata for a Swap with a V2 Route.
   * @param trade The V2Trade to encode.
   * @param options SwapOptions to use for the trade.
   * @param routerMustCustody Flag for whether funds should be sent to the router
   * @param performAggregatedSlippageCheck Flag for whether we want to perform an aggregated slippage check
   * @returns A string array of calldatas for the trade.
   */
  private static encodeV2Swap(
    trade: V2Trade<Currency, Currency, TradeType>,
    options: SwapOptions,
    routerMustCustody: boolean,
    performAggregatedSlippageCheck: boolean
  ): string {
    const amountIn: string = toHex(trade.maximumAmountIn(options.slippageTolerance).quotient)
    const amountOut: string = toHex(trade.minimumAmountOut(options.slippageTolerance).quotient)

    const path = trade.route.path.map((token) => token.address)
    const recipient = routerMustCustody
      ? ADDRESS_THIS
      : typeof options.recipient === 'undefined'
      ? MSG_SENDER
      : validateAndParseAddress(options.recipient)

    if (trade.tradeType === TradeType.EXACT_INPUT) {
      const exactInputParams = [amountIn, performAggregatedSlippageCheck ? 0 : amountOut, path, recipient]

      return SwapRouterFlood.INTERFACE.encodeFunctionData('swapExactTokensForTokens', exactInputParams)
    } else {
      const exactOutputParams = [amountOut, amountIn, path, recipient]

      return SwapRouterFlood.INTERFACE.encodeFunctionData('swapTokensForExactTokens', exactOutputParams)
    }
  }

  /**
   * @notice Generates the calldata for a Swap with a V3 Route.
   * @param trade The V3FloodTrade to encode.
   * @param options SwapOptions to use for the trade.
   * @param routerMustCustody Flag for whether funds should be sent to the router
   * @param performAggregatedSlippageCheck Flag for whether we want to perform an aggregated slippage check
   * @returns A string array of calldatas for the trade.
   */
  private static encodeV3Swap(
    trade: V3FloodTrade<Currency, Currency, TradeType>,
    options: SwapOptions,
    routerMustCustody: boolean,
    performAggregatedSlippageCheck: boolean
  ): string[] {
    const calldatas: string[] = []

    for (const { route, inputAmount, outputAmount } of trade.swaps) {
      const amountIn: string = toHex(trade.maximumAmountIn(options.slippageTolerance, inputAmount).quotient)
      const amountOut: string = toHex(trade.minimumAmountOut(options.slippageTolerance, outputAmount).quotient)

      // flag for whether the trade is single hop or not
      const singleHop = route.pools.length === 1

      const recipient = routerMustCustody
        ? ADDRESS_THIS
        : typeof options.recipient === 'undefined'
        ? MSG_SENDER
        : validateAndParseAddress(options.recipient)

      if (singleHop) {
        if (trade.tradeType === TradeType.EXACT_INPUT) {
          const exactInputSingleParams = {
            tokenIn: route.tokenPath[0].address,
            tokenOut: route.tokenPath[1].address,
            fee: route.pools[0].fee,
            recipient,
            amountIn,
            amountOutMinimum: performAggregatedSlippageCheck ? 0 : amountOut,
            sqrtPriceLimitX96: 0,
          }

          calldatas.push(SwapRouterFlood.INTERFACE.encodeFunctionData('exactInputSingle', [exactInputSingleParams]))
        } else {
          const exactOutputSingleParams = {
            tokenIn: route.tokenPath[0].address,
            tokenOut: route.tokenPath[1].address,
            fee: route.pools[0].fee,
            recipient,
            amountOut,
            amountInMaximum: amountIn,
            sqrtPriceLimitX96: 0,
          }

          calldatas.push(SwapRouterFlood.INTERFACE.encodeFunctionData('exactOutputSingle', [exactOutputSingleParams]))
        }
      } else {
        const path: string = encodeRouteToPath(route, trade.tradeType === TradeType.EXACT_OUTPUT)

        if (trade.tradeType === TradeType.EXACT_INPUT) {
          const exactInputParams = {
            path,
            recipient,
            amountIn,
            amountOutMinimum: performAggregatedSlippageCheck ? 0 : amountOut,
          }

          calldatas.push(SwapRouterFlood.INTERFACE.encodeFunctionData('exactInput', [exactInputParams]))
        } else {
          const exactOutputParams = {
            path,
            recipient,
            amountOut,
            amountInMaximum: amountIn,
          }

          calldatas.push(SwapRouterFlood.INTERFACE.encodeFunctionData('exactOutput', [exactOutputParams]))
        }
      }
    }

    return calldatas
  }

  /**
   * @notice Generates the calldata for a MixedRouteSwap. Since single hop routes are not MixedRoutes, we will instead generate
   *         them via the existing encodeV3Swap and encodeV2Swap methods.
   * @param trade The MixedRouteTrade to encode.
   * @param options SwapOptions to use for the trade.
   * @param routerMustCustody Flag for whether funds should be sent to the router
   * @param performAggregatedSlippageCheck Flag for whether we want to perform an aggregated slippage check
   * @returns A string array of calldatas for the trade.
   */
  private static encodeMixedRouteSwap(
    trade: MixedRouteTrade<Currency, Currency, TradeType>,
    options: SwapOptions,
    routerMustCustody: boolean,
    performAggregatedSlippageCheck: boolean
  ): string[] {
    const calldatas: string[] = []

    invariant(trade.tradeType === TradeType.EXACT_INPUT, 'TRADE_TYPE')

    for (const { route, inputAmount, outputAmount } of trade.swaps) {
      const amountIn: string = toHex(trade.maximumAmountIn(options.slippageTolerance, inputAmount).quotient)
      const amountOut: string = toHex(trade.minimumAmountOut(options.slippageTolerance, outputAmount).quotient)

      // flag for whether the trade is single hop or not
      const singleHop = route.pools.length === 1

      const recipient = routerMustCustody
        ? ADDRESS_THIS
        : typeof options.recipient === 'undefined'
        ? MSG_SENDER
        : validateAndParseAddress(options.recipient)

      const mixedRouteIsAllV3 = (route: MixedRouteSDK<Currency, Currency>) => {
        return route.pools.every((pool) => pool instanceof Pool)
      }

      if (singleHop) {
        /// For single hop, since it isn't really a mixedRoute, we'll just mimic behavior of V3 or V2
        /// We don't use encodeV3Swap() or encodeV2Swap() because casting the trade to a V3FloodTrade or V2Trade is overcomplex
        if (mixedRouteIsAllV3(route)) {
          const exactInputSingleParams = {
            tokenIn: route.path[0].address,
            tokenOut: route.path[1].address,
            fee: (route.pools as Pool[])[0].fee,
            recipient,
            amountIn,
            amountOutMinimum: performAggregatedSlippageCheck ? 0 : amountOut,
            sqrtPriceLimitX96: 0,
          }

          calldatas.push(SwapRouterFlood.INTERFACE.encodeFunctionData('exactInputSingle', [exactInputSingleParams]))
        } else {
          const path = route.path.map((token) => token.address)

          const exactInputParams = [amountIn, performAggregatedSlippageCheck ? 0 : amountOut, path, recipient]

          calldatas.push(SwapRouterFlood.INTERFACE.encodeFunctionData('swapExactTokensForTokens', exactInputParams))
        }
      } else {
        const sections = partitionMixedRouteByProtocol(route)

        const isLastSectionInRoute = (i: number) => {
          return i === sections.length - 1
        }

        let outputToken
        let inputToken = route.input.wrapped

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i]
          /// Now, we get output of this section
          outputToken = getOutputOfPools(section, inputToken)

          const newRouteOriginal = new MixedRouteSDK(
            [...section],
            section[0].token0.equals(inputToken) ? section[0].token0 : section[0].token1,
            outputToken
          )
          const newRoute = new MixedRoute(newRouteOriginal)

          /// Previous output is now input
          inputToken = outputToken

          if (mixedRouteIsAllV3(newRoute)) {
            const path: string = encodeMixedRouteToPath(newRoute)
            const exactInputParams = {
              path,
              // By default router holds funds until the last swap, then it is sent to the recipient
              // special case exists where we are unwrapping WETH output, in which case `routerMustCustody` is set to true
              // and router still holds the funds. That logic bundled into how the value of `recipient` is calculated
              recipient: isLastSectionInRoute(i) ? recipient : ADDRESS_THIS,
              amountIn: i == 0 ? amountIn : 0,
              amountOutMinimum: !isLastSectionInRoute(i) ? 0 : amountOut,
            }

            calldatas.push(SwapRouterFlood.INTERFACE.encodeFunctionData('exactInput', [exactInputParams]))
          } else {
            const exactInputParams = [
              i == 0 ? amountIn : 0, // amountIn
              !isLastSectionInRoute(i) ? 0 : amountOut, // amountOutMin
              newRoute.path.map((token) => token.address), // path
              isLastSectionInRoute(i) ? recipient : ADDRESS_THIS, // to
            ]

            calldatas.push(SwapRouterFlood.INTERFACE.encodeFunctionData('swapExactTokensForTokens', exactInputParams))
          }
        }
      }
    }

    return calldatas
  }

  private static encodeSwaps(
    trade: AnyFloodTradeType,
    options: SwapOptions,
    isSwapAndAdd?: boolean
  ): {
    calldatas: string[]
    sampleTrade:
      | V2Trade<Currency, Currency, TradeType>
      | V3FloodTrade<Currency, Currency, TradeType>
      | MixedRouteTrade<Currency, Currency, TradeType>
    allTrades: (
      | V2Trade<Currency, Currency, TradeType>
      | V3FloodTrade<Currency, Currency, TradeType>
      | MixedRouteTrade<Currency, Currency, TradeType>
    )[]
    routerMustCustody: boolean
    inputIsNative: boolean
    outputIsNative: boolean
    totalAmountIn: CurrencyAmount<Currency>
    minimumAmountOut: CurrencyAmount<Currency>
    quoteAmountOut: CurrencyAmount<Currency>
  } {
    const individualTrades: (
      | V2Trade<Currency, Currency, TradeType>
      | V3FloodTrade<Currency, Currency, TradeType>
      | MixedRouteTrade<Currency, Currency, TradeType>
    )[] = []

    // If dealing with an instance of the aggregated Trade object, unbundle it to individual trade objects.
    if (trade instanceof FloodTrade) {
      invariant(
        trade.swaps.every(
          (swap) =>
            swap.route.protocol == Protocol.V3 ||
            swap.route.protocol == Protocol.V2 ||
            swap.route.protocol == Protocol.MIXED
        ),
        'UNSUPPORTED_PROTOCOL'
      )

      for (const { route, inputAmount, outputAmount } of trade.swaps) {
        if (route.protocol == Protocol.V2) {
          individualTrades.push(
            new V2Trade(
              route as RouteV2<Currency, Currency>,
              trade.tradeType == TradeType.EXACT_INPUT ? inputAmount : outputAmount,
              trade.tradeType
            )
          )
        } else if (route.protocol == Protocol.V3) {
          individualTrades.push(
            V3FloodTrade.createUncheckedTrade({
              route: route as RouteV3<Currency, Currency>,
              inputAmount,
              outputAmount,
              tradeType: trade.tradeType,
            })
          )
        } else if (route.protocol == Protocol.MIXED) {
          individualTrades.push(
            /// we can change the naming of this function on MixedRouteTrade if needed
            MixedRouteTrade.createUncheckedTrade({
              route: route as MixedRoute<Currency, Currency>,
              inputAmount,
              outputAmount,
              tradeType: trade.tradeType,
            })
          )
        } else {
          throw new Error('UNSUPPORTED_TRADE_PROTOCOL')
        }
      }
    } else {
      individualTrades.push(trade)
    }

    const numberOfTrades = individualTrades.reduce(
      (numberOfTrades, trade) =>
        numberOfTrades + (trade instanceof V3FloodTrade || trade instanceof MixedRouteTrade ? trade.swaps.length : 1),
      0
    )

    // All trades should have the same starting/ending currency and trade type
    // invariant(
    //   trades.every((trade) => trade.inputAmount.currency.equals(sampleTrade.inputAmount.currency)),
    //   'TOKEN_IN_DIFF'
    // )
    // invariant(
    //   trades.every((trade) => trade.outputAmount.currency.equals(sampleTrade.outputAmount.currency)),
    //   'TOKEN_OUT_DIFF'
    // )
    // invariant(
    //   trade.every((trade) => trade.tradeType === sampleTrade.tradeType),
    //   'TRADE_TYPE_DIFF'
    // )

    const calldatas: string[] = []

    const inputIsNative = trade.inputAmount.currency.isNative
    const outputIsNative = trade.outputAmount.currency.isNative

    // flag for whether we want to perform an aggregated slippage check
    //   1. when there are >2 exact input trades. this is only a heuristic,
    //      as it's still more gas-expensive even in this case, but has benefits
    //      in that the reversion probability is lower
    const performAggregatedSlippageCheck = trade.tradeType === TradeType.EXACT_INPUT && numberOfTrades > 2
    // flag for whether funds should be send first to the router
    //   1. when receiving ETH (which much be unwrapped from WETH)
    //   2. when a fee on the output is being taken
    //   3. when performing swap and add
    //   4. when performing an aggregated slippage check
    const routerMustCustody = outputIsNative || !!options.fee || !!isSwapAndAdd || performAggregatedSlippageCheck

    // encode permit if necessary
    if (options.inputTokenPermit) {
      invariant(trade.inputAmount.currency.isToken, 'NON_TOKEN_PERMIT')
      calldatas.push(SelfPermit.encodePermit(trade.inputAmount.currency, options.inputTokenPermit))
    }

    for (const trade of individualTrades) {
      if (trade instanceof V2Trade) {
        calldatas.push(SwapRouterFlood.encodeV2Swap(trade, options, routerMustCustody, performAggregatedSlippageCheck))
      } else if (trade instanceof V3FloodTrade) {
        for (const calldata of SwapRouterFlood.encodeV3Swap(
          trade,
          options,
          routerMustCustody,
          performAggregatedSlippageCheck
        )) {
          calldatas.push(calldata)
        }
      } else if (trade instanceof MixedRouteTrade) {
        for (const calldata of SwapRouterFlood.encodeMixedRouteSwap(
          trade,
          options,
          routerMustCustody,
          performAggregatedSlippageCheck
        )) {
          calldatas.push(calldata)
        }
      } else {
        throw new Error('Unsupported trade object')
      }
    }

    const totalAmountIn = trade.inputAmount
    const minimumAmountOut: CurrencyAmount<Currency> = trade.minimumAmountOut(options.slippageTolerance)
    const quoteAmountOut: CurrencyAmount<Currency> = trade.outputAmount

    return {
      calldatas,
      sampleTrade: individualTrades[0],
      allTrades: individualTrades,
      routerMustCustody,
      inputIsNative,
      outputIsNative,
      totalAmountIn,
      minimumAmountOut,
      quoteAmountOut,
    }
  }

  /**
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
   * @param trade to produce call parameters for
   * @param options options for the call parameters
   */
  public static swapCallParameters(
    trade:
      | FloodTrade<Currency, Currency, TradeType>
      | V2Trade<Currency, Currency, TradeType>
      | V3FloodTrade<Currency, Currency, TradeType>
      | MixedRouteTrade<Currency, Currency, TradeType>,
    options: SwapOptions
  ): MethodParameters {
    const {
      calldatas,
      sampleTrade,
      allTrades,
      routerMustCustody,
      inputIsNative,
      outputIsNative,
      totalAmountIn,
      minimumAmountOut,
    } = SwapRouterFlood.encodeSwaps(trade, options)

    // unwrap or sweep
    if (routerMustCustody) {
      //  for all the tokens at the end of a path, we either need to unwrap WETH9 or sweep the token
      // we first calculate the netfllows of the trade, that is, how much of each token is bought / sold.
      const netflows = allTrades.reduce((netflows, trade) => {
        const input = trade.inputAmount.currency.wrapped
        const output = trade.outputAmount.currency.wrapped
        netflows.set(input, netflows.get(input)?.subtract(trade.inputAmount) ?? trade.inputAmount.multiply(-1))
        netflows.set(output, netflows.get(output)?.add(trade.outputAmount) ?? trade.outputAmount)
        return netflows
      }, new Map<Currency, CurrencyAmount<Currency>>())

      const sweepCalls = [...netflows.entries()].flatMap(([token, amount]) => {
        // no need to sweep if we are not receiving any of the token
        if (JSBI.lessThanOrEqual(amount.quotient, ZERO)) {
          return []
        }
        if (token.isNative) {
          return [PaymentsExtended.encodeUnwrapWETH9(amount.quotient, options.recipient, options.fee)]
        } else {
          return [PaymentsExtended.encodeSweepToken(token.wrapped, amount.quotient, options.recipient, options.fee)]
        }
      })
      calldatas.push(...sweepCalls)
      // if (outputIsNative) {
      //   calldatas.push(PaymentsExtended.encodeUnwrapWETH9(minimumAmountOut.quotient, options.recipient, options.fee))
      // } else {
      //   calldatas.push(
      //     PaymentsExtended.encodeSweepToken(
      //       sampleTrade.outputAmount.currency.wrapped,
      //       minimumAmountOut.quotient,
      //       options.recipient,
      //       options.fee
      //     )
      //   )
      // }
    }

    // must refund when paying in ETH: either with an uncertain input amount OR if there's a chance of a partial fill.
    // unlike ERC20's, the full ETH value must be sent in the transaction, so the rest must be refunded.
    if (
      inputIsNative &&
      (sampleTrade.tradeType === TradeType.EXACT_OUTPUT || SwapRouterFlood.riskOfPartialFill(trade))
    ) {
      calldatas.push(Payments.encodeRefundETH())
    }

    return {
      calldata: MulticallExtended.encodeMulticall(calldatas, options.deadlineOrPreviousBlockhash),
      value: toHex(inputIsNative ? totalAmountIn.quotient : ZERO),
    }
  }

  // if price impact is very high, there's a chance of hitting max/min prices resulting in a partial fill of the swap
  private static riskOfPartialFill(trades: AnyFloodTradeType): boolean {
    if (Array.isArray(trades)) {
      return trades.some((trade) => {
        return SwapRouterFlood.v3TradeWithHighPriceImpact(trade)
      })
    } else {
      return SwapRouterFlood.v3TradeWithHighPriceImpact(trades)
    }
  }

  private static v3TradeWithHighPriceImpact(
    trade:
      | FloodTrade<Currency, Currency, TradeType>
      | V2Trade<Currency, Currency, TradeType>
      | V3FloodTrade<Currency, Currency, TradeType>
      | MixedRouteTrade<Currency, Currency, TradeType>
  ): boolean {
    // return !(trade instanceof V2Trade) && trade.priceImpact.greaterThan(REFUND_ETH_PRICE_IMPACT_THRESHOLD)
    // tbd how price impact should be calculated for flood trades
    return false
  }
}
