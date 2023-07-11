import { Trade } from '@thinkincoin/router-sdk'
import { Currency, Percent, TradeType } from '@thinkincoin-libs/sdk-core'
import { PermitSignature } from 'hooks/usePermitAllowance'
import { useMemo } from 'react'

import { useTransactionAdder } from '../state/transactions/hooks'
import { TransactionInfo, TransactionType } from '../state/transactions/types'
import { currencyId } from '../utils/currencyId'
import useTransactionDeadline from './useTransactionDeadline'
import { useUniversalRouterSwapCallback } from './useUniversalRouter'

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  fiatValues: { amountIn?: number; amountOut?: number }, // usd values for amount in and out, logged for analytics
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
    const info: TransactionInfo = {
      type: TransactionType.SWAP,
      inputCurrencyId: currencyId(trade.inputAmount.currency),
      outputCurrencyId: currencyId(trade.outputAmount.currency),
      ...(trade.tradeType === TradeType.EXACT_INPUT
        ? {
            tradeType: TradeType.EXACT_INPUT,
            inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
            expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
            minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(allowedSlippage).quotient.toString(),
          }
        : {
            tradeType: TradeType.EXACT_OUTPUT,
            maximumInputCurrencyAmountRaw: trade.maximumAmountIn(allowedSlippage).quotient.toString(),
            outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
            expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
          }),
    }
    return () =>
      swapCallback().then((response) => {
        addTransaction(response, info, deadline?.toNumber())
        return response.hash
      })
  }, [addTransaction, allowedSlippage, deadline, swapCallback, trade])

  return {
    callback,
  }
}
