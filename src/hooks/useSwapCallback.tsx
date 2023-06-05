import { Percent, TradeType } from '@uniswap/sdk-core'
import { PermitSignature } from 'hooks/usePermitAllowance'
import { useCallback } from 'react'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { isClassicTrade, isUniswapXTrade } from 'state/routing/utils'

import { useTransactionAdder } from '../state/transactions/hooks'
import { TransactionType } from '../state/transactions/types'
import { currencyId } from '../utils/currencyId'
import useTransactionDeadline from './useTransactionDeadline'
import useUniswapXSwapCallback from './useUniswapXSwapCallback'
import useUniversalRouterSwapCallback from './useUniversalRouter'

export type SwapResult = Awaited<ReturnType<ReturnType<typeof useSwapCallback>>>

// Returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: InterfaceTrade | undefined, // trade to execute, required
  fiatValues: { amountIn?: number; amountOut?: number }, // usd values for amount in and out, logged for analytics
  allowedSlippage: Percent, // in bips
  permitSignature: PermitSignature | undefined
) {
  const deadline = useTransactionDeadline()

  const addTransaction = useTransactionAdder()

  const uniswapXSwapCallback = useUniswapXSwapCallback(isUniswapXTrade(trade) ? trade : undefined)

  const universalRouterSwapCallback = useUniversalRouterSwapCallback(
    isClassicTrade(trade) ? trade : undefined,
    fiatValues,
    {
      slippageTolerance: allowedSlippage,
      deadline,
      permit: permitSignature,
    }
  )

  const swapCallback = isUniswapXTrade(trade) ? uniswapXSwapCallback : universalRouterSwapCallback

  return useCallback(async () => {
    if (!trade) throw new Error('missing trade')

    const result = await swapCallback()

    if (result.type === TradeFillType.UniswapX) {
      // TODO(Gouda): Add to transaction history here - Carter
    } else {
      addTransaction(
        result.response,
        trade.tradeType === TradeType.EXACT_INPUT
          ? {
              type: TransactionType.SWAP,
              tradeType: TradeType.EXACT_INPUT,
              inputCurrencyId: currencyId(trade.inputAmount.currency),
              inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
              expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
              outputCurrencyId: currencyId(trade.outputAmount.currency),
              minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(allowedSlippage).quotient.toString(),
              isUniswapXOrder: false,
            }
          : {
              type: TransactionType.SWAP,
              tradeType: TradeType.EXACT_OUTPUT,
              inputCurrencyId: currencyId(trade.inputAmount.currency),
              maximumInputCurrencyAmountRaw: trade.maximumAmountIn(allowedSlippage).quotient.toString(),
              outputCurrencyId: currencyId(trade.outputAmount.currency),
              outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
              expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
              isUniswapXOrder: false,
            }
      )
    }
    return result
  }, [addTransaction, allowedSlippage, swapCallback, trade])
}
