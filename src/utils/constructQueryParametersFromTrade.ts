import { Trade, TradeType } from '@uniswap/sdk'

// given a trade, construct the query parameters that link to it
export default function constructQueryParametersFromTrade(trade: Trade) {
  const exactAmount =
    trade.tradeType === TradeType.EXACT_INPUT ? trade.inputAmount.toExact() : trade.outputAmount.toExact()
  const exactField = trade.tradeType === TradeType.EXACT_INPUT ? 'input' : 'output'
  return `inputCurrency=${trade.inputAmount.token.address}&outputCurrency=${trade.outputAmount.token.address}&exactAmount=${exactAmount}&exactField=${exactField}`
}
