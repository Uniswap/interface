import { useMemo } from 'react'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { useNativeCurrencyInfo, useWrappedNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionDetails, WrapTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import { getFormattedCurrencyAmount } from 'wallet/src/utils/currency'

export function WrapSummaryItem({
  transaction,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: WrapTransactionInfo }
}): JSX.Element {
  const formatter = useLocalizationContext()
  const { unwrapped } = transaction.typeInfo

  const nativeCurrencyInfo = useNativeCurrencyInfo(transaction.chainId)
  const wrappedCurrencyInfo = useWrappedNativeCurrencyInfo(transaction.chainId)

  const caption = useMemo(() => {
    if (!nativeCurrencyInfo || !wrappedCurrencyInfo) {
      return ''
    }

    const inputCurrencyInfo = unwrapped ? wrappedCurrencyInfo : nativeCurrencyInfo
    const outputCurrencyInfo = unwrapped ? nativeCurrencyInfo : wrappedCurrencyInfo

    const { currency: inputCurrency } = inputCurrencyInfo
    const { currency: outputCurrency } = outputCurrencyInfo
    const currencyAmount = getFormattedCurrencyAmount(inputCurrency, transaction.typeInfo.currencyAmountRaw, formatter)
    const otherCurrencyAmount = getFormattedCurrencyAmount(
      outputCurrency,
      transaction.typeInfo.currencyAmountRaw,
      formatter,
    )
    return `${currencyAmount}${inputCurrency.symbol} → ${otherCurrencyAmount}${outputCurrency.symbol}`
  }, [nativeCurrencyInfo, transaction.typeInfo.currencyAmountRaw, unwrapped, wrappedCurrencyInfo, formatter])

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={
        <SplitLogo
          chainId={transaction.chainId}
          inputCurrencyInfo={unwrapped ? wrappedCurrencyInfo : nativeCurrencyInfo}
          outputCurrencyInfo={unwrapped ? nativeCurrencyInfo : wrappedCurrencyInfo}
          size={TXN_HISTORY_ICON_SIZE}
        />
      }
      index={index}
      transaction={transaction}
    />
  )
}
