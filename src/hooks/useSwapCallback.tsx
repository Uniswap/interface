// eslint-disable-next-line no-restricted-imports
import { Percent, TradeType } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { SwapCallbackState, useSwapCallback as useLibSwapCallBack } from 'lib/hooks/swap/useSwapCallback'
import { ReactNode, useMemo } from 'react'

import { useTransactionAdder } from '../state/transactions/hooks'
import { TransactionType } from '../state/transactions/types'
import { currencyId } from '../utils/currencyId'
import useENS from './useENS'
import { SignatureData } from './useERC20Permit'
import { AnyTrade } from './useSwapCallArguments'
import useTransactionDeadline from './useTransactionDeadline'

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: AnyTrade | undefined, // trade to execute, required
  allowedSlippage: Percent, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | undefined | null
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: ReactNode | null } {
  const { account } = useActiveWeb3React()

  const deadline = useTransactionDeadline()

  const addTransaction = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  const {
    state,
    callback: libCallback,
    error,
  } = useLibSwapCallBack({ trade, allowedSlippage, recipientAddressOrName: recipient, signatureData, deadline })

  const callback = useMemo(() => {
    if (!libCallback || !trade) {
      return null
    }
    return () =>
      libCallback().then((response) => {
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
  }, [addTransaction, allowedSlippage, libCallback, trade])

  return {
    state,
    callback,
    error,
  }
}
