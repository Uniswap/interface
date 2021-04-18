import { Route, Token, TokenAmount, Trade, TradeType } from '@ubeswap/sdk'
import { ROUTER_ADDRESS } from 'constants/index'

export interface TradeRouter {
  routerAddress?: string
}

export const defaultRouter: TradeRouter = {
  routerAddress: ROUTER_ADDRESS,
}

export class UbeswapTrade extends Trade {
  hidePairAnalytics = true
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
