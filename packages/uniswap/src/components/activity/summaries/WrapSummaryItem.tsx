import { useMemo } from 'react'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useNativeCurrencyInfo, useWrappedNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionDetails, WrapTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount } from 'uniswap/src/utils/currency'

export function WrapSummaryItem({
  transaction,
  index,
  isExternalProfile,
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
    const currencyAmount = getFormattedCurrencyAmount({
      currency: inputCurrency,
      amount: transaction.typeInfo.currencyAmountRaw,
      formatter,
    })
    const otherCurrencyAmount = getFormattedCurrencyAmount({
      currency: outputCurrency,
      amount: transaction.typeInfo.currencyAmountRaw,
      formatter,
    })
    return `${currencyAmount}${inputCurrency.symbol} → ${otherCurrencyAmount}${outputCurrency.symbol}`
  }, [nativeCurrencyInfo, transaction.typeInfo.currencyAmountRaw, unwrapped, wrappedCurrencyInfo, formatter])

  const icon = useMemo(
    () => (
      <SplitLogo
        chainId={transaction.chainId}
        inputCurrencyInfo={unwrapped ? wrappedCurrencyInfo : nativeCurrencyInfo}
        outputCurrencyInfo={unwrapped ? nativeCurrencyInfo : wrappedCurrencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
      />
    ),
    [nativeCurrencyInfo, transaction.chainId, unwrapped, wrappedCurrencyInfo],
  )

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={icon}
      index={index}
      transaction={transaction}
      isExternalProfile={isExternalProfile}
    />
  )
}
