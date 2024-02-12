import { TradeType } from '@uniswap/sdk-core'
import { createElement, useMemo } from 'react'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { SplitLogo } from 'wallet/src/components/CurrencyLogo/SplitLogo'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'
import {
  SummaryItemProps,
  TransactionSummaryLayoutProps,
} from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  isConfirmedSwapTypeInfo,
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
  const { typeInfo } = transaction
  const inputCurrencyInfo = useCurrencyInfo(typeInfo.inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(typeInfo.outputCurrencyId)
  const formatter = useLocalizationContext()

  const caption = useMemo(() => {
    if (!inputCurrencyInfo || !outputCurrencyInfo) {
      return ''
    }

    const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)
    const { currency: inputCurrency } = inputCurrencyInfo
    const { currency: outputCurrency } = outputCurrencyInfo
    const currencyAmount = getFormattedCurrencyAmount(
      inputCurrency,
      inputCurrencyAmountRaw,
      formatter,
      //** isApproximateAmount - input value and confirmed amount are both exact so this should be false **//
      isConfirmedSwapTypeInfo(typeInfo) ? false : typeInfo.tradeType === TradeType.EXACT_OUTPUT
    )
    const otherCurrencyAmount = getFormattedCurrencyAmount(
      outputCurrency,
      outputCurrencyAmountRaw,
      formatter,
      //** isApproximateAmount - input value and confirmed amount are both exact so this should be false **//
      isConfirmedSwapTypeInfo(typeInfo) ? false : typeInfo.tradeType === TradeType.EXACT_INPUT
    )
    return `${currencyAmount}${getSymbolDisplayText(
      inputCurrency.symbol
    )} → ${otherCurrencyAmount}${getSymbolDisplayText(outputCurrency.symbol)}`
  }, [inputCurrencyInfo, outputCurrencyInfo, formatter, typeInfo])

  // For retrying failed, locally submitted swaps
  const swapFormState = swapCallbacks?.useSwapFormTransactionState(
    transaction.from,
    transaction.chainId,
    transaction.id
  )

  const latestSwapTx = swapCallbacks?.useLatestSwapTransaction(transaction.from)
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
