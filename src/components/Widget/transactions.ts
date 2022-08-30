import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { TradeType, TransactionEventHandlers } from '@uniswap/widgets'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useCallback, useMemo } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import {
  BaseSwapTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
} from 'state/transactions/types'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { currencyId } from 'utils/currencyId'

/** Integrates the Widget's transactions, showing the widget's transactions in the app. */
export function useSyncWidgetTransactions() {
  const addTransaction = useTransactionAdder()
  const onTxSubmit = useCallback(
    (_hash: string, transaction: Transaction) => {
      const { trade, tradeType, txResponse } = transaction
      const autoSlippageTolerance = useAutoSlippageTolerance(trade)
      const allowedSlippage = useUserSlippageToleranceWithDefault(autoSlippageTolerance)

      if (!trade || !tradeType || !allowedSlippage || !txResponse) {
        return
      }
      if (type === TransactionType.APPROVAL) {
      }
      if (type === TransactionType.WRAP) {
      }
      if (type === TransactionType.UNWRAP) {
      }
      if (type === TransactionType.SWAP) {
        const baseTxInfo: BaseSwapTransactionInfo = {
          type: TransactionType.SWAP,
          tradeType,
          inputCurrencyId: currencyId(trade.inputAmount.currency),
          outputCurrencyId: currencyId(trade.outputAmount.currency),
        }
        if (tradeType === TradeType.EXACT_OUTPUT) {
          addTransaction(txResponse, {
            ...baseTxInfo,
            maximumInputCurrencyAmountRaw: trade.maximumAmountIn(allowedSlippage).quotient.toString(),
            outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
            expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
          } as ExactOutputSwapTransactionInfo)
        } else {
          addTransaction(txResponse, {
            ...baseTxInfo,
            inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
            expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
            minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(allowedSlippage).quotient.toString(),
          } as ExactInputSwapTransactionInfo)
        }
      }
    },
    [addTransaction]
  )

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
