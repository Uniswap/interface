import { TradeType } from '@uniswap/sdk-core'
import { createElement, useMemo } from 'react'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { SplitLogo } from 'wallet/src/components/CurrencyLogo/SplitLogo'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import {
  SummaryItemProps,
  TransactionSummaryLayoutProps,
} from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionDetails,
} from 'wallet/src/features/transactions/types'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'wallet/src/utils/currency'

const MAX_SHOW_RETRY_TIME = 15 * ONE_MINUTE_MS

export function SwapSummaryItem({
  transaction,
  layoutElement,
  swapCallbacks,
}: SummaryItemProps & {
  transaction: TransactionDetails & {
    typeInfo: ExactOutputSwapTransactionInfo | ExactInputSwapTransactionInfo
  }
}): JSX.Element {
  const inputCurrencyInfo = useCurrencyInfo(transaction.typeInfo.inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(transaction.typeInfo.outputCurrencyId)

  const caption = useMemo(() => {
    if (!inputCurrencyInfo || !outputCurrencyInfo) {
      return ''
    }

    const [inputAmountRaw, outputAmountRaw] =
      transaction.typeInfo.tradeType === TradeType.EXACT_INPUT
        ? [
            transaction.typeInfo.inputCurrencyAmountRaw,
            transaction.typeInfo.expectedOutputCurrencyAmountRaw,
          ]
        : [
            transaction.typeInfo.expectedInputCurrencyAmountRaw,
            transaction.typeInfo.outputCurrencyAmountRaw,
          ]

    const { currency: inputCurrency } = inputCurrencyInfo
    const { currency: outputCurrency } = outputCurrencyInfo
    const currencyAmount = getFormattedCurrencyAmount(inputCurrency, inputAmountRaw)
    const otherCurrencyAmount = getFormattedCurrencyAmount(outputCurrency, outputAmountRaw)
    return `${currencyAmount}${getSymbolDisplayText(
      inputCurrency.symbol
    )} → ${otherCurrencyAmount}${getSymbolDisplayText(outputCurrency.symbol)}`
  }, [inputCurrencyInfo, outputCurrencyInfo, transaction.typeInfo])

  // For retrying failed, locally submitted swaps
  const swapFormState = swapCallbacks?.getSwapFormTransactionState(
    transaction.from,
    transaction.chainId,
    transaction.id
  )

  const latestSwapTx = swapCallbacks?.getLatestSwapTransaction(transaction.from)
  const isTheLatestSwap = latestSwapTx && latestSwapTx.id === transaction.id
  // if this is the latest tx or it was added within the last 15 minutes, show the retry button
  const shouldShowRetry =
    isTheLatestSwap ||
    (Date.now() - transaction.addedTime < MAX_SHOW_RETRY_TIME && swapCallbacks?.onRetryGenerator)

  const onRetry = swapCallbacks?.onRetryGenerator?.(swapFormState)

  return createElement(layoutElement as React.FunctionComponent<TransactionSummaryLayoutProps>, {
    caption,
    icon: (
      <SplitLogo
        chainId={transaction.chainId}
        inputCurrencyInfo={inputCurrencyInfo}
        outputCurrencyInfo={outputCurrencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
      />
    ),
    transaction,
    onRetry: swapFormState && shouldShowRetry ? onRetry : undefined,
  })
}
