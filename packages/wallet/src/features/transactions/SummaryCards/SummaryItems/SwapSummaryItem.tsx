import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionDetails,
  isConfirmedSwapTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'

const MAX_SHOW_RETRY_TIME = 15 * ONE_MINUTE_MS

export function SwapSummaryItem({
  transaction,
  swapCallbacks,
  index,
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
      isConfirmedSwapTypeInfo(typeInfo) ? false : typeInfo.tradeType === TradeType.EXACT_OUTPUT,
    )
    const otherCurrencyAmount = getFormattedCurrencyAmount(
      outputCurrency,
      outputCurrencyAmountRaw,
      formatter,
      //** isApproximateAmount - input value and confirmed amount are both exact so this should be false **//
      isConfirmedSwapTypeInfo(typeInfo) ? false : typeInfo.tradeType === TradeType.EXACT_INPUT,
    )
    return `${currencyAmount}${getSymbolDisplayText(
      inputCurrency.symbol,
    )} → ${otherCurrencyAmount}${getSymbolDisplayText(outputCurrency.symbol)}`
  }, [inputCurrencyInfo, outputCurrencyInfo, formatter, typeInfo])

  // For retrying failed, locally submitted swaps
  const swapFormState = swapCallbacks?.useSwapFormTransactionState(
    transaction.from,
    transaction.chainId,
    transaction.id,
  )

  const latestSwapTx = swapCallbacks?.useLatestSwapTransaction(transaction.from)
  const isTheLatestSwap = latestSwapTx && latestSwapTx.id === transaction.id
  // if this is the latest tx or it was added within the last 15 minutes, show the retry button
  const shouldShowRetry =
    isTheLatestSwap || (Date.now() - transaction.addedTime < MAX_SHOW_RETRY_TIME && swapCallbacks?.onRetryGenerator)

  const onRetry = swapCallbacks?.onRetryGenerator?.(swapFormState)

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={
        <SplitLogo
          chainId={transaction.chainId}
          inputCurrencyInfo={inputCurrencyInfo}
          outputCurrencyInfo={outputCurrencyInfo}
          size={TXN_HISTORY_ICON_SIZE}
        />
      }
      index={index}
      transaction={transaction}
      onRetry={swapFormState && shouldShowRetry ? onRetry : undefined}
    />
  )
}
