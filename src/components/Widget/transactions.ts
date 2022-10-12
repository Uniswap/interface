import {
  TradeType,
  Transaction,
  TransactionEventHandlers,
  TransactionInfo,
  TransactionType as WidgetTransactionType,
} from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent } from 'analytics'
import { EventName, SectionName } from 'analytics/constants'
import { useTrace } from 'analytics/Trace'
import { formatToDecimal, getTokenAddress } from 'analytics/utils'
import { formatSwapSignedAnalyticsEventProperties } from 'analytics/utils'
import { WrapType } from 'hooks/useWrapCallback'
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
  const trace = useTrace({ section: SectionName.WIDGET })

  const { chainId } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const onTxSubmit = useCallback(
    (_hash: string, transaction: Transaction<TransactionInfo>) => {
      const { type, response } = transaction.info

      if (!type || !response) {
        return
      } else if (type === WidgetTransactionType.WRAP || type === WidgetTransactionType.UNWRAP) {
        const { type, amount: transactionAmount } = transaction.info

        const eventProperties = {
          // get this info from widget handlers
          token_in_address: getTokenAddress(transactionAmount.currency),
          token_out_address: getTokenAddress(transactionAmount.currency.wrapped),
          token_in_symbol: transactionAmount.currency.symbol,
          token_out_symbol: transactionAmount.currency.wrapped.symbol,
          chain_id: transactionAmount.currency.chainId,
          amount: transactionAmount
            ? formatToDecimal(transactionAmount, transactionAmount?.currency.decimals)
            : undefined,
          type: type === WidgetTransactionType.WRAP ? WrapType.WRAP : WrapType.UNWRAP,
          ...trace,
        }
        sendAnalyticsEvent(EventName.WRAP_TOKEN_TXN_SUBMITTED, eventProperties)
        const { amount } = transaction.info
        addTransaction(response, {
          type: AppTransactionType.WRAP,
          unwrapped: type === WidgetTransactionType.UNWRAP,
          currencyAmountRaw: amount.quotient.toString(),
          chainId,
        } as WrapTransactionInfo)
      } else if (type === WidgetTransactionType.SWAP) {
        const { slippageTolerance, trade, tradeType } = transaction.info

        const eventProperties = {
          ...formatSwapSignedAnalyticsEventProperties({
            trade,
            txHash: transaction.receipt?.transactionHash ?? '',
          }),
          ...trace,
        }
        sendAnalyticsEvent(EventName.SWAP_SIGNED, eventProperties)
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
      }
    },
    [addTransaction, chainId, trace]
  )

  const txHandlers: TransactionEventHandlers = useMemo(() => ({ onTxSubmit }), [onTxSubmit])

  return { transactions: { ...txHandlers } }
}
