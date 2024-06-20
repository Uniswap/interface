import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { Trade, UniswapXTrade } from 'wallet/src/features/transactions/swap/trade/types'

export function isUniswapX(trade: Trade): trade is UniswapXTrade {
  return trade.routing === Routing.DUTCH_V2
}
