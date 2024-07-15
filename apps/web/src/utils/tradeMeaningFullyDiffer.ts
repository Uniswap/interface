import { Percent } from '@uniswap/sdk-core'
import { InterfaceTrade } from 'state/routing/types'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * i.e. if the trade details don't match, or if the new price is worse than the old price.
 * @param args either a pair of V2 trades or a pair of V3 trades
 */
export function tradeMeaningfullyDiffers(
  currentTrade: InterfaceTrade,
  newTrade: InterfaceTrade,
  slippage: Percent
): boolean {
  return (
    currentTrade.tradeType !== newTrade.tradeType ||
    !currentTrade.inputAmount.currency.equals(newTrade.inputAmount.currency) ||
    !currentTrade.outputAmount.currency.equals(newTrade.outputAmount.currency) ||
    newTrade.executionPrice.lessThan(currentTrade.worstExecutionPrice(slippage))
  )
}
