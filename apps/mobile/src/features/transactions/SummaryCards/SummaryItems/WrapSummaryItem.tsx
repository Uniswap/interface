import React, { useMemo } from 'react'
import { SplitLogo } from 'src/components/CurrencyLogo/SplitLogo'
import { getFormattedCurrencyAmount } from 'src/features/notifications/utils'
import {
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'src/features/tokens/useCurrencyInfo'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { TransactionDetails, WrapTransactionInfo } from 'src/features/transactions/types'

export default function WrapSummaryItem({
  transaction,
}: {
  transaction: TransactionDetails & { typeInfo: WrapTransactionInfo }
}): JSX.Element {
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
    const currencyAmount = getFormattedCurrencyAmount(
      inputCurrency,
      transaction.typeInfo.currencyAmountRaw
    )
    const otherCurrencyAmount = getFormattedCurrencyAmount(
      outputCurrency,
      transaction.typeInfo.currencyAmountRaw
    )
    return `${currencyAmount}${inputCurrency.symbol} → ${otherCurrencyAmount}${outputCurrency.symbol}`
  }, [nativeCurrencyInfo, transaction.typeInfo.currencyAmountRaw, unwrapped, wrappedCurrencyInfo])

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
      transaction={transaction}
    />
  )
}
