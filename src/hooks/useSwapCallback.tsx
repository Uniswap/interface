import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { PermitSignature } from 'hooks/usePermitAllowance'
import { useMemo } from 'react'

import { useTransactionAdder } from '../state/transactions/hooks'
import { TransactionType } from '../state/transactions/types'
import { currencyId } from '../utils/currencyId'
import useTransactionDeadline from './useTransactionDeadline'
import { useUniversalRouterSwapCallback } from './useUniversalRouter'

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  fiatValues: { amountIn: number | undefined; amountOut: number | undefined }, // usd values for amount in and out, logged for analytics
  allowedSlippage: Percent, // in bips
  permitSignature: PermitSignature | undefined
): { callback: null | (() => Promise<string>) } {
  const deadline = useTransactionDeadline()

  const addTransaction = useTransactionAdder()

  const universalRouterSwapCallback = useUniversalRouterSwapCallback(trade, fiatValues, {
    slippageTolerance: allowedSlippage,
    deadline,
    permit: permitSignature,
  })
  const swapCallback = universalRouterSwapCallback

  const callback = useMemo(() => {
    if (!trade || !swapCallback) return null
    return () =>
      swapCallback().then((response) => {
        addTransaction(
          response,
          trade.tradeType === TradeType.EXACT_INPUT
            ? {
                type: TransactionType.SWAP,
                tradeType: TradeType.EXACT_INPUT,
                inputCurrencyId: currencyId(trade.inputAmount.currency),
                inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                outputCurrencyId: currencyId(trade.outputAmount.currency),
                minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(allowedSlippage).quotient.toString(),
              }
            : {
                type: TransactionType.SWAP,
                tradeType: TradeType.EXACT_OUTPUT,
                inputCurrencyId: currencyId(trade.inputAmount.currency),
                maximumInputCurrencyAmountRaw: trade.maximumAmountIn(allowedSlippage).quotient.toString(),
                outputCurrencyId: currencyId(trade.outputAmount.currency),
                outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
              }
        )
        return response.hash
      })
  }, [addTransaction, allowedSlippage, swapCallback, trade])

  return {
    callback,
  }
}
