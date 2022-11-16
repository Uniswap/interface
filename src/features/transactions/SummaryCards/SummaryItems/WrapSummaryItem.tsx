import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SwapLogoOrLogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { nativeOnChain } from 'src/constants/tokens'
import BalanceUpdate from 'src/features/transactions/SummaryCards/BalanceUpdate'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
import { TransactionStatus, WrapTransactionInfo } from 'src/features/transactions/types'

export default function WrapSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: WrapTransactionInfo } }) {
  const { t } = useTranslation()

  const nativeCurrency = nativeOnChain(transaction.chainId)
  const wrappedNativeCurrency = nativeCurrency?.wrapped
  const outputCurrency = transaction.typeInfo.unwrapped ? nativeCurrency : wrappedNativeCurrency

  const showCancelIcon =
    (transaction.status === TransactionStatus.Cancelled ||
      transaction.status === TransactionStatus.Cancelling) &&
    showInlineWarning
  const titleText = transaction.typeInfo.unwrapped ? t('Unwrap') : t('Wrap')
  const title = formatTitleWithStatus({
    status: transaction.status,
    text: titleText,
    showInlineWarning,
    t,
  })

  const caption = transaction.typeInfo.unwrapped
    ? `${wrappedNativeCurrency.symbol} → ${nativeCurrency.symbol}`
    : `${nativeCurrency.symbol} → ${wrappedNativeCurrency.symbol}`

  const endAdornment = useMemo(() => {
    if (nativeCurrency && transaction.typeInfo.currencyAmountRaw) {
      return (
        <BalanceUpdate
          amountRaw={transaction.typeInfo.currencyAmountRaw}
          currency={outputCurrency}
          transactedUSDValue={transaction.typeInfo.transactedUSDValue}
          transactionStatus={transaction.status}
          transactionType={transaction.typeInfo.type}
        />
      )
    }
  }, [
    nativeCurrency,
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
          inputCurrency={transaction.typeInfo.unwrapped ? wrappedNativeCurrency : nativeCurrency}
          outputCurrency={transaction.typeInfo.unwrapped ? nativeCurrency : wrappedNativeCurrency}
          showCancelIcon={showCancelIcon}
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
