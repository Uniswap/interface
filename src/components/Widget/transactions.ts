import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { TransactionEventHandlers } from '@uniswap/widgets'
import { useMemo } from 'react'

/** Integrates the Widget's transactions, showing the widget's transactions in the app. */
export function useSyncWidgetTransactions() {
  // TODO(jfrankfurt): Integrate widget transactions with app transaction tracking.
  const txHandlers: TransactionEventHandlers = useMemo(
    () => ({
      onTxSubmit: (hash: string, tx: unknown) => console.log('onTxSubmit'),
      onTxSuccess: (hash: string, receipt: TransactionReceipt) => console.log('onTxSuccess'),
      onTxFail: (hash: string, receipt: TransactionReceipt) => console.log('onTxFail'),
    }),
    []
  )

  return { transactions: { ...txHandlers } }
}
