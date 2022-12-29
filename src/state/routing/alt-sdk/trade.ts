import { IRoute, MixedRoute, MixedRouteSDK, ONE, RouteV2, RouteV3, ZERO } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Fraction, Percent, Price, TradeType } from '@uniswap/sdk-core'
import { Pair, Route as V2RouteSDK } from '@uniswap/v2-sdk'
import { Pool, Route as V3RouteSDK } from '@uniswap/v3-sdk'
import invariant from 'tiny-invariant'

// Fork of @uniswap/router-sdk/src/entities/trade.ts to allow routes to have different input and output currencies
export class FloodTrade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  public readonly routes: IRoute<Currency, Currency, Pair | Pool>[]
  public readonly tradeType: TTradeType
  private _outputAmount: CurrencyAmount<TOutput> | undefined
  private _inputAmount: CurrencyAmount<TInput> | undefined
  private _outputCurrency: TOutput
  private _inputCurrency: TInput

  /**
   * The swaps of the trade, i.e. which routes and how much is swapped in each that
   * make up the trade. May consist of swaps in v2 or v3.
   */
  public readonly swaps: {
    route: IRoute<Currency, Currency, Pair | Pool>
    inputAmount: CurrencyAmount<Currency>
    outputAmount: CurrencyAmount<Currency>
  }[]

  //  construct a trade across v2 and v3 routes from pre-computed amounts
  public constructor({
    v2Routes,
    v3Routes,
    tradeType,
    mixedRoutes,
    inputCurrency,
    outputCurrency,
  }: {
    v2Routes: {
      routev2: V2RouteSDK<Currency, Currency>
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
    v3Routes: {
      routev3: V3RouteSDK<Currency, Currency>
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
    tradeType: TTradeType
    mixedRoutes?: {
      mixedRoute: MixedRouteSDK<Currency, Currency>
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
    inputCurrency: TInput
    outputCurrency: TOutput
  }) {
    this._inputCurrency = inputCurrency
    this._outputCurrency = outputCurrency

    this.swaps = []
    this.routes = []
    // wrap v2 routes
    for (const { routev2, inputAmount, outputAmount } of v2Routes) {
      const route = new RouteV2(routev2)
      this.routes.push(route)
      this.swaps.push({
        route,
        inputAmount,
        outputAmount,
      })
    }
    // wrap v3 routes
    for (const { routev3, inputAmount, outputAmount } of v3Routes) {
      const route = new RouteV3(routev3)
      this.routes.push(route)
      this.swaps.push({
        route,
        inputAmount,
        outputAmount,
      })
    }
    // wrap mixedRoutes
    if (mixedRoutes) {
      for (const { mixedRoute, inputAmount, outputAmount } of mixedRoutes) {
        const route = new MixedRoute(mixedRoute)
        this.routes.push(route)
        this.swaps.push({
          route,
          inputAmount,
          outputAmount,
        })
      }
    }
    this.tradeType = tradeType

    // we disable this check as we allow routes to have different input and output currencies
    // each route must have the same input and output currency
    // const inputCurrency = this.swaps[0].inputAmount.currency
    // const outputCurrency = this.swaps[0].outputAmount.currency
    // invariant(
    //   this.swaps.every(({ route }) => inputCurrency.wrapped.equals(route.input.wrapped)),
    //   'INPUT_CURRENCY_MATCH'
    // )
    // invariant(
    //   this.swaps.every(({ route }) => outputCurrency.wrapped.equals(route.output.wrapped)),
    //   'OUTPUT_CURRENCY_MATCH'
    // )

    // pools must be unique inter protocols
    const numPools = this.swaps.map(({ route }) => route.pools.length).reduce((total, cur) => total + cur, 0)
    const poolAddressSet = new Set<string>()
    for (const { route } of this.swaps) {
      for (const pool of route.pools) {
        if (pool instanceof Pool) {
          poolAddressSet.add(Pool.getAddress(pool.token0, pool.token1, (pool as Pool).fee))
        } else if (pool instanceof Pair) {
          const pair = pool
          poolAddressSet.add(Pair.getAddress(pair.token0, pair.token1))
        } else {
          throw new Error('Unexpected pool type in route when constructing trade object')
        }
      }
    }
    invariant(numPools == poolAddressSet.size, 'POOLS_DUPLICATED')
  }

  public get inputAmount(): CurrencyAmount<TInput> {
    if (this._inputAmount) {
      return this._inputAmount
    }

    let inputAmount = CurrencyAmount.fromRawAmount(this._inputCurrency, 0)

    for (const swap of this.swaps) {
      if (swap.inputAmount.currency.wrapped.equals(this._inputCurrency.wrapped)) {
        // convert to output currency to support wrapped tokens
        inputAmount = inputAmount.add(
          CurrencyAmount.fromFractionalAmount(
            this._inputCurrency,
            swap.inputAmount.numerator,
            swap.inputAmount.denominator
          )
        )
      }
      if (swap.outputAmount.currency.wrapped.equals(this._inputCurrency.wrapped)) {
        // convert to output currency to support wrapped tokens
        inputAmount = inputAmount.subtract(
          CurrencyAmount.fromFractionalAmount(
            this._inputCurrency,
            swap.outputAmount.numerator,
            swap.outputAmount.denominator
          )
        )
      }
    }

    this._inputAmount = inputAmount
    return this._inputAmount
  }

  public get outputAmount(): CurrencyAmount<TOutput> {
    if (this._outputAmount) {
      return this._outputAmount
    }
    let outputAmount = CurrencyAmount.fromRawAmount(this._outputCurrency, 0)

    for (const swap of this.swaps) {
      if (swap.outputAmount.currency.wrapped.equals(this._outputCurrency.wrapped)) {
        // convert to output currency to support wrapped tokens
        outputAmount = outputAmount.add(
          CurrencyAmount.fromFractionalAmount(
            this._outputCurrency,
            swap.outputAmount.numerator,
            swap.outputAmount.denominator
          )
        )
      }
      if (swap.inputAmount.currency.wrapped.equals(this._outputCurrency.wrapped)) {
        // convert to output currency to support wrapped tokens
        outputAmount = outputAmount.subtract(
          CurrencyAmount.fromFractionalAmount(
            this._outputCurrency,
            swap.inputAmount.numerator,
            swap.inputAmount.denominator
          )
        )
      }
    }

    this._outputAmount = outputAmount
    return this._outputAmount
  }

  private _executionPrice: Price<TInput, TOutput> | undefined

  /**
   * The price expressed in terms of output amount/input amount.
   */
  public get executionPrice(): Price<TInput, TOutput> {
    return (
      this._executionPrice ??
      (this._executionPrice = new Price(
        this.inputAmount.currency,
        this.outputAmount.currency,
        this.inputAmount.quotient,
        this.outputAmount.quotient
      ))
    )
  }

  /**
   * The cached result of the price impact computation
   * @private
   */
  //  private _priceImpact: Percent | undefined
  /**
   * Not possible to estimate price impact for a flood trade. TBD on how to handle this.
   * Returns the percent difference between the route's mid price and the price impact
   */
  // public get priceImpact(): Percent {
  //   if (this._priceImpact) {
  //     return this._priceImpact
  //   }

  //   let spotOutputAmount = CurrencyAmount.fromRawAmount(this.outputAmount.currency, 0)
  //   for (const { route, inputAmount } of this.swaps) {
  //     const midPrice = route.midPrice
  //     spotOutputAmount = spotOutputAmount.add(midPrice.quote(inputAmount))
  //   }

  //   const priceImpact = spotOutputAmount.subtract(this.outputAmount).divide(spotOutputAmount)
  //   this._priceImpact = new Percent(priceImpact.numerator, priceImpact.denominator)
  //   return this._priceImpact
  // }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
   * @returns The amount out
   */
  public minimumAmountOut(slippageTolerance: Percent, amountOut = this.outputAmount): CurrencyAmount<TOutput> {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return amountOut
    } else {
      const slippageAdjustedAmountOut = new Fraction(ONE)
        .add(slippageTolerance)
        .invert()
        .multiply(amountOut.quotient).quotient
      return CurrencyAmount.fromRawAmount(amountOut.currency, slippageAdjustedAmountOut)
    }
  }

  /**
   * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
   * @param slippageTolerance The tolerance of unfavorable slippage from the execution price of this trade
   * @returns The amount in
   */
  public maximumAmountIn(slippageTolerance: Percent, amountIn = this.inputAmount): CurrencyAmount<TInput> {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return amountIn
    } else {
      const slippageAdjustedAmountIn = new Fraction(ONE).add(slippageTolerance).multiply(amountIn.quotient).quotient
      return CurrencyAmount.fromRawAmount(amountIn.currency, slippageAdjustedAmountIn)
    }
  }

  /**
   * Return the execution price after accounting for slippage tolerance
   * @param slippageTolerance the allowed tolerated slippage
   * @returns The execution price
   */
  public worstExecutionPrice(slippageTolerance: Percent): Price<TInput, TOutput> {
    return new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.maximumAmountIn(slippageTolerance).quotient,
      this.minimumAmountOut(slippageTolerance).quotient
    )
  }

  // public static async fromRoutes<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(
  //   v2Routes: {
  //     routev2: V2RouteSDK<TInput, TOutput>
  //     amount: TTradeType extends TradeType.EXACT_INPUT ? CurrencyAmount<TInput> : CurrencyAmount<TOutput>
  //   }[],
  //   v3Routes: {
  //     routev3: V3RouteSDK<TInput, TOutput>
  //     amount: TTradeType extends TradeType.EXACT_INPUT ? CurrencyAmount<TInput> : CurrencyAmount<TOutput>
  //   }[],
  //   tradeType: TTradeType,
  //   mixedRoutes?: {
  //     mixedRoute: MixedRouteSDK<TInput, TOutput>
  //     amount: TTradeType extends TradeType.EXACT_INPUT ? CurrencyAmount<TInput> : CurrencyAmount<TOutput>
  //   }[]
  // ): Promise<FloodTrade<TInput, TOutput, TTradeType>> {
  //   const populatedV2Routes: {
  //     routev2: V2RouteSDK<TInput, TOutput>
  //     inputAmount: CurrencyAmount<TInput>
  //     outputAmount: CurrencyAmount<TOutput>
  //   }[] = []
  //
  //   const populatedV3Routes: {
  //     routev3: V3RouteSDK<TInput, TOutput>
  //     inputAmount: CurrencyAmount<TInput>
  //     outputAmount: CurrencyAmount<TOutput>
  //   }[] = []
  //
  //   const populatedMixedRoutes: {
  //     mixedRoute: MixedRouteSDK<TInput, TOutput>
  //     inputAmount: CurrencyAmount<TInput>
  //     outputAmount: CurrencyAmount<TOutput>
  //   }[] = []
  //
  //   for (const { routev2, amount } of v2Routes) {
  //     const v2Trade = new V2TradeSDK(routev2, amount, tradeType)
  //     const { inputAmount, outputAmount } = v2Trade
  //
  //     populatedV2Routes.push({
  //       routev2,
  //       inputAmount,
  //       outputAmount,
  //     })
  //   }
  //
  //   for (const { routev3, amount } of v3Routes) {
  //     const v3Trade = await V3TradeSDK.fromRoute(routev3, amount, tradeType)
  //     const { inputAmount, outputAmount } = v3Trade
  //
  //     populatedV3Routes.push({
  //       routev3,
  //       inputAmount,
  //       outputAmount,
  //     })
  //   }
  //
  //   if (mixedRoutes) {
  //     for (const { mixedRoute, amount } of mixedRoutes) {
  //       const mixedRouteTrade = await MixedRouteTradeSDK.fromRoute(mixedRoute, amount, tradeType)
  //       const { inputAmount, outputAmount } = mixedRouteTrade
  //
  //       populatedMixedRoutes.push({
  //         mixedRoute,
  //         inputAmount,
  //         outputAmount,
  //       })
  //     }
  //   }
  //
  //   return new FloodTrade({
  //     v2Routes: populatedV2Routes,
  //     v3Routes: populatedV3Routes,
  //     mixedRoutes: populatedMixedRoutes,
  //     tradeType,
  //   })
  // }
  //
  // public static async fromRoute<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(
  //   route: V2RouteSDK<TInput, TOutput> | V3RouteSDK<TInput, TOutput> | MixedRouteSDK<TInput, TOutput>,
  //   amount: TTradeType extends TradeType.EXACT_INPUT ? CurrencyAmount<TInput> : CurrencyAmount<TOutput>,
  //   tradeType: TTradeType
  // ): Promise<FloodTrade<TInput, TOutput, TTradeType>> {
  //   let v2Routes: {
  //     routev2: V2RouteSDK<TInput, TOutput>
  //     inputAmount: CurrencyAmount<TInput>
  //     outputAmount: CurrencyAmount<TOutput>
  //   }[] = []
  //
  //   let v3Routes: {
  //     routev3: V3RouteSDK<TInput, TOutput>
  //     inputAmount: CurrencyAmount<TInput>
  //     outputAmount: CurrencyAmount<TOutput>
  //   }[] = []
  //
  //   let mixedRoutes: {
  //     mixedRoute: MixedRouteSDK<TInput, TOutput>
  //     inputAmount: CurrencyAmount<TInput>
  //     outputAmount: CurrencyAmount<TOutput>
  //   }[] = []
  //
  //   if (route instanceof V2RouteSDK) {
  //     const v2Trade = new V2TradeSDK(route, amount, tradeType)
  //     const { inputAmount, outputAmount } = v2Trade
  //     v2Routes = [{ routev2: route, inputAmount, outputAmount }]
  //   } else if (route instanceof V3RouteSDK) {
  //     const v3Trade = await V3TradeSDK.fromRoute(route, amount, tradeType)
  //     const { inputAmount, outputAmount } = v3Trade
  //     v3Routes = [{ routev3: route, inputAmount, outputAmount }]
  //   } else if (route instanceof MixedRouteSDK) {
  //     const mixedRouteTrade = await MixedRouteTradeSDK.fromRoute(route, amount, tradeType)
  //     const { inputAmount, outputAmount } = mixedRouteTrade
  //     mixedRoutes = [{ mixedRoute: route, inputAmount, outputAmount }]
  //   } else {
  //     throw new Error('Invalid route type')
  //   }
  //
  //   return new FloodTrade({
  //     v2Routes,
  //     v3Routes,
  //     mixedRoutes,
  //     tradeType,
  //   })
  // }
}
