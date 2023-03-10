import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SwapLogoOrLogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import {
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'src/features/tokens/useCurrencyInfo'
import BalanceUpdate from 'src/features/transactions/SummaryCards/BalanceUpdate'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { getTransactionTitle } from 'src/features/transactions/SummaryCards/utils'
import { WrapTransactionInfo } from 'src/features/transactions/types'

export default function WrapSummaryItem({
  transaction,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: WrapTransactionInfo } }): JSX.Element {
  const { t } = useTranslation()
  const { unwrapped } = transaction.typeInfo

  const nativeCurrencyInfo = useNativeCurrencyInfo(transaction.chainId)
  const wrappedCurrencyInfo = useWrappedNativeCurrencyInfo(transaction.chainId)
  const outputCurrency = unwrapped ? nativeCurrencyInfo : wrappedCurrencyInfo

  const titleText = unwrapped ? t('Unwrap') : t('Wrap')
  const title = getTransactionTitle(transaction.status, titleText, t)

  const caption = unwrapped
    ? `${wrappedCurrencyInfo?.currency.symbol} → ${nativeCurrencyInfo?.currency.symbol}`
    : `${nativeCurrencyInfo?.currency.symbol} → ${wrappedCurrencyInfo?.currency.symbol}`

  const endAdornment = useMemo(() => {
    if (outputCurrency && transaction.typeInfo.currencyAmountRaw) {
      return (
        <BalanceUpdate
          amountRaw={transaction.typeInfo.currencyAmountRaw}
          currency={outputCurrency.currency}
          transactedUSDValue={transaction.typeInfo.transactedUSDValue}
          transactionStatus={transaction.status}
          transactionType={transaction.typeInfo.type}
        />
      )
    }
  }, [
    outputCurrency,
    transaction.status,
    transaction.typeInfo.currencyAmountRaw,
    transaction.typeInfo.transactedUSDValue,
    transaction.typeInfo.type,
  ])

  return (
    <TransactionSummaryLayout
      caption={caption}
      endAdornment={endAdornment}
      icon={
        <SwapLogoOrLogoWithTxStatus
          inputCurrencyInfo={unwrapped ? wrappedCurrencyInfo : nativeCurrencyInfo}
          outputCurrencyInfo={unwrapped ? nativeCurrencyInfo : wrappedCurrencyInfo}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
        />
      }
      readonly={readonly}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
