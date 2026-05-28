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
import { TransactionSummaryLayout } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE, useOnRetrySwap } from 'wallet/src/features/transactions/SummaryCards/utils'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'

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
  const onRetry = useOnRetrySwap(transaction, swapCallbacks)

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

  const icon = useMemo(
    () => (
      <SplitLogo
        chainId={transaction.chainId}
        inputCurrencyInfo={inputCurrencyInfo}
        outputCurrencyInfo={outputCurrencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
      />
    ),
    [inputCurrencyInfo, outputCurrencyInfo, transaction.chainId],
  )

  return (
    <TransactionSummaryLayout caption={caption} icon={icon} index={index} transaction={transaction} onRetry={onRetry} />
  )
}
