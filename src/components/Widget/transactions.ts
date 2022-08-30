import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { TradeType, Transaction, TransactionEventHandlers, TransactionInfo, TransactionType } from '@uniswap/widgets'
import { useCallback, useMemo } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { ExactInputSwapTransactionInfo, ExactOutputSwapTransactionInfo } from 'state/transactions/types'
import { currencyId } from 'utils/currencyId'

/** Integrates the Widget's transactions, showing the widget's transactions in the app. */
export function useSyncWidgetTransactions() {
  const addTransaction = useTransactionAdder()

  const onTxSubmit = useCallback((_hash: string, transaction: Transaction<TransactionInfo>) => {
    const { type, response } = transaction.info

    if (!type || !response) {
      return
    }
    if ([TransactionType.UNWRAP, TransactionType.WRAP].includes(type)) {
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
  }, [])

  const txHandlers: TransactionEventHandlers = useMemo(
    () => ({
      onTxSubmit,
      onTxSuccess: (hash: string, receipt: TransactionReceipt) => console.log('onTxSuccess'),
      onTxFail: (hash: string, receipt: TransactionReceipt) => console.log('onTxFail'),
    }),
    []
  )

  return { transactions: { ...txHandlers } }
}
