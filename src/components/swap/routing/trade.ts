import { BigNumberish } from '@ethersproject/bignumber'
import { BytesLike } from '@ethersproject/bytes'
import { Pair, Percent, Price, Route, Token, TokenAmount, Trade, TradeType } from '@ubeswap/sdk'
import { ROUTER_ADDRESS } from 'constants/index'

export interface TradeRouter {
  routerAddress?: string
}

export const defaultRouter: TradeRouter = {
  routerAddress: ROUTER_ADDRESS,
}

export class UbeswapTrade extends Trade {
  hidePairAnalytics = false
  router: TradeRouter
  readonly path: readonly Token[]

  constructor(route: Route, amount: TokenAmount, tradeType: TradeType, router: TradeRouter, path: readonly Token[]) {
    super(route, amount, tradeType)
    this.router = router
    this.path = path
  }

  static fromInnerTrade(innerTrade: Trade, router: TradeRouter, path: readonly Token[]) {
    return new UbeswapTrade(
      innerTrade.route,
      innerTrade.tradeType === TradeType.EXACT_INPUT ? innerTrade.inputAmount : innerTrade.outputAmount,
      innerTrade.tradeType,
      router,
      path
    )
  }

  static fromNormalTrade(trade: Trade): UbeswapTrade {
    return UbeswapTrade.fromInnerTrade(trade, defaultRouter, trade.route.path)
  }
}

export interface SwapPayload {
  path: string[]
  pairs: string[]
  extras: BytesLike[]
  inputAmount: BigNumberish
  minOutputAmount: BigNumberish
  expectedOutputAmount: BigNumberish
  to?: string
  deadline: BigNumberish
  partner: BigNumberish
  sig: BytesLike
}

export interface MinimaPayloadDetails {
  path: string[]
  pairs: string[]
  extras: BytesLike[]
  inputAmount: string
  expectedOutputAmount: string
  deadline: string
  partner: string
  sig: BytesLike
}

export interface MinimaTradePayload {
  expectedOut: string
  minimumExpectedOut?: string
  routerAddress: string
  priceImpact: {
    numerator: number
    denominator: number
  }
  details: MinimaPayloadDetails
  txn?: {
    data: string
    to: string
    gas: string
    from: string
  }
}

export class MinimaRouterTrade extends UbeswapTrade {
  /**
   * The input amount for the trade assuming no slippage.
   */
  inputAmount: TokenAmount
  /**
   * The output amount for the trade assuming no slippage.
   */
  outputAmount: TokenAmount
  /**
   * The price expressed in terms of output amount/input amount.
   */
  executionPrice: Price
  /**
   * The mid price after the trade executes assuming no slippage.
   */
  nextMidPrice: Price
  /**
   * The percent difference between the mid price before the trade and the trade execution price.
   */
  priceImpact: Percent
  /**
   * Every field that is needed for executing a swap is contained within the details object
   */
  details: SwapPayload

  constructor(
    route: Route,
    inputAmount: TokenAmount,
    outputAmount: TokenAmount,
    router: TradeRouter,
    priceImpact: Percent,
    path: readonly Token[],
    details: SwapPayload,
    public txn?: { data: string; to: string }
  ) {
    super(route, inputAmount, 0, router, path)
    this.router = router
    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.executionPrice = new Price(inputAmount.token, outputAmount.token, inputAmount.raw, outputAmount.raw)
    this.nextMidPrice = new Price(inputAmount.token, outputAmount.token, inputAmount.raw, outputAmount.raw)
    this.priceImpact = priceImpact
    this.hidePairAnalytics = true
    this.details = details
  }

  static fromMinimaTradePayload(
    pairs: Pair[],
    inputAmount: TokenAmount,
    outputAmount: TokenAmount,
    routerAddress: string,
    priceImpact: Percent,
    path: readonly Token[],
    details: SwapPayload
  ) {
    return new MinimaRouterTrade(
      new Route(pairs, inputAmount.currency),
      inputAmount,
      outputAmount,
      { routerAddress },
      priceImpact,
      path,
      details
    )
  }
}
