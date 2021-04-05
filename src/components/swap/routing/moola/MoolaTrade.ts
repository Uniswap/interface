import { Percent, Price, Route, TokenAmount, Trade, TradeType } from '@ubeswap/sdk'

export class MoolaTrade extends Trade {
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

  isWithdrawal(): boolean {
    return this.inputAmount.currency.symbol?.startsWith('m') ?? false
  }

  constructor(route: Route, inputAmount: TokenAmount, outputAmount: TokenAmount, tradeType: TradeType) {
    super(route, inputAmount, tradeType)
    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.executionPrice = Price.fromRoute(route)
    this.nextMidPrice = Price.fromRoute(route)
    this.priceImpact = new Percent('0')
  }

  static fromIn(route: Route, inputAmount: TokenAmount): MoolaTrade {
    return new MoolaTrade(route, inputAmount, new TokenAmount(route.output, inputAmount.raw), TradeType.EXACT_INPUT)
  }

  static fromOut(route: Route, outputAmount: TokenAmount): MoolaTrade {
    return new MoolaTrade(route, new TokenAmount(route.output, outputAmount.raw), outputAmount, TradeType.EXACT_OUTPUT)
  }
}
