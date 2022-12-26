import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { FloodTrade } from 'state/routing/alt-sdk/trade'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param args either a pair of V2 trades or a pair of V3 trades
 */
export function tradeMeaningfullyDiffers(
  ...args: [
    Trade<Currency, Currency, TradeType> | FloodTrade<Currency, Currency, TradeType>,
    Trade<Currency, Currency, TradeType> | FloodTrade<Currency, Currency, TradeType>
  ]
): boolean {
  const [tradeA, tradeB] = args
  return (
    tradeA.tradeType !== tradeB.tradeType ||
    !tradeA.inputAmount.currency.equals(tradeB.inputAmount.currency) ||
    !tradeA.inputAmount.equalTo(tradeB.inputAmount) ||
    !tradeA.outputAmount.currency.equals(tradeB.outputAmount.currency) ||
    !tradeA.outputAmount.equalTo(tradeB.outputAmount)
  )
}
