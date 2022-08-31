import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { TradeType, Transaction, TransactionEventHandlers, TransactionInfo, TransactionType } from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { V3_SWAP_DEFAULT_SLIPPAGE } from 'hooks/useAutoSlippageTolerance'
import { useCallback, useMemo } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  WrapTransactionInfo,
} from 'state/transactions/types'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { currencyId } from 'utils/currencyId'

/** Integrates the Widget's transactions, showing the widget's transactions in the app. */
export function useSyncWidgetTransactions() {
  const { chainId } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const [appSlippage] = useUserSlippageTolerance()
  const allowedSlippage = appSlippage === 'auto' ? V3_SWAP_DEFAULT_SLIPPAGE : appSlippage

  const onTxSubmit = useCallback(
    (_hash: string, transaction: Transaction<TransactionInfo>) => {
      const { type, response } = transaction.info

      if (!type || !response) {
        return
      }
      if (type === TransactionType.WRAP || type === TransactionType.UNWRAP) {
        const { amount } = transaction.info

        addTransaction(response, {
          type: TransactionType.WRAP,
          unwrapped: false,
          currencyAmountRaw: amount.quotient.toString(),
          chainId,
        } as unknown as WrapTransactionInfo)
      }
      if (type === TransactionType.SWAP) {
        const { trade, tradeType } = transaction.info
        const baseTxInfo = {
          type: TransactionType.SWAP,
          tradeType,
          inputCurrencyId: currencyId(trade.inputAmount.currency),
          outputCurrencyId: currencyId(trade.outputAmount.currency),
        }
        if (tradeType === TradeType.EXACT_OUTPUT) {
          addTransaction(response, {
            ...baseTxInfo,
            maximumInputCurrencyAmountRaw: trade.maximumAmountIn(allowedSlippage).quotient.toString(),
            outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
            expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
          } as unknown as ExactOutputSwapTransactionInfo)
        } else {
          addTransaction(response, {
            ...baseTxInfo,
            inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
            expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
            minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(allowedSlippage).quotient.toString(),
          } as unknown as ExactInputSwapTransactionInfo)
        }
      }
    },
    [addTransaction, allowedSlippage, chainId]
  )

  const txHandlers: TransactionEventHandlers = useMemo(
    () => ({
      onTxSubmit,
      onTxSuccess: (hash: string, receipt: TransactionReceipt) => console.log('onTxSuccess', hash, receipt),
      onTxFail: (hash: string, receipt: TransactionReceipt) => console.log('onTxFail', hash, receipt),
    }),
    [onTxSubmit]
  )

  return { transactions: { ...txHandlers } }
}
