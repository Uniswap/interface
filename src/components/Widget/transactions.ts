import {
  TradeType,
  Transaction,
  TransactionEventHandlers,
  TransactionInfo,
  TransactionType as WidgetTransactionType,
} from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent } from 'analytics'
import { ElementName, EventName, SectionName } from 'analytics/constants'
import { useCallback, useMemo } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionType as AppTransactionType,
  WrapTransactionInfo,
} from 'state/transactions/types'
import { currencyId } from 'utils/currencyId'

/** Integrates the Widget's transactions, showing the widget's transactions in the app. */
export function useSyncWidgetTransactions() {
  const { chainId } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const onTxSubmit = useCallback(
    (_hash: string, transaction: Transaction<TransactionInfo>) => {
      const { type, response } = transaction.info

      if (!type || !response) {
        return
      } else if (type === WidgetTransactionType.WRAP || type === WidgetTransactionType.UNWRAP) {
        // TODO(lynnshaoyu): WRAP_TOKEN_TXN_SUBMITTED
        const eventProperties = {
          // get this info from widget handlers
          token_in_address: undefined,
          token_out_address: undefined,
          token_in_symbol: undefined,
          token_out_symbol: undefined,
          chain_id: undefined,
          amount: undefined,
        }
        sendAnalyticsEvent(EventName.WRAP_TOKEN_TXN_SUBMITTED, {
          section: SectionName.WIDGET,
          ...eventProperties,
          type,
        })
        const { amount } = transaction.info
        addTransaction(response, {
          type: AppTransactionType.WRAP,
          unwrapped: type === WidgetTransactionType.UNWRAP,
          currencyAmountRaw: amount.quotient.toString(),
          chainId,
        } as WrapTransactionInfo)
      } else if (type === WidgetTransactionType.SWAP) {
        const { slippageTolerance, trade, tradeType } = transaction.info
        const baseTxInfo = {
          type: AppTransactionType.SWAP,
          tradeType,
          inputCurrencyId: currencyId(trade.inputAmount.currency),
          outputCurrencyId: currencyId(trade.outputAmount.currency),
        }
        if (tradeType === TradeType.EXACT_OUTPUT) {
          addTransaction(response, {
            ...baseTxInfo,
            maximumInputCurrencyAmountRaw: trade.maximumAmountIn(slippageTolerance).quotient.toString(),
            outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
            expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
          } as ExactOutputSwapTransactionInfo)
        } else {
          addTransaction(response, {
            ...baseTxInfo,
            inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
            expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
            minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(slippageTolerance).quotient.toString(),
          } as ExactInputSwapTransactionInfo)
        }
        // TODO(lynnshaoyu): add event properties for SWAP_SUBMITTED_BUTTON_CLICKED
        const eventProperties = {}
        sendAnalyticsEvent(EventName.SWAP_SIGNED, {
          element: ElementName.CONFIRM_SWAP_BUTTON,
          section: SectionName.WIDGET,
          ...eventProperties,
        })
      }
    },
    [addTransaction, chainId]
  )

  const txHandlers: TransactionEventHandlers = useMemo(() => ({ onTxSubmit }), [onTxSubmit])

  return { transactions: { ...txHandlers } }
}
