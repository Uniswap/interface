import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SwapLogoOrLogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { PollingInterval } from 'src/constants/misc'
import { nativeOnChain } from 'src/constants/tokens'
import { useSpotPricesQuery } from 'src/features/dataApi/slice'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
import {
  TransactionStatus,
  TransactionType,
  WrapTransactionInfo,
} from 'src/features/transactions/types'

export default function WrapSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: WrapTransactionInfo } }) {
  const { t } = useTranslation()

  const nativeCurrency = nativeOnChain(transaction.chainId)
  const wrappedNativeCurrency = nativeCurrency?.wrapped

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

  const { currentData } = useSpotPricesQuery(
    {
      chainId: transaction.chainId,
      addresses: [nativeCurrency.wrapped.address],
    },
    // Covalent pricing endpoint only refreshes every 30 minutes
    { pollingInterval: PollingInterval.Slow }
  )

  const balanceUpdate = useMemo(() => {
    return createBalanceUpdate(
      TransactionType.Swap,
      transaction.status,
      transaction.typeInfo.unwrapped ? nativeCurrency : wrappedNativeCurrency,
      transaction.typeInfo.currencyAmountRaw,
      currentData
    )
  }, [
    currentData,
    nativeCurrency,
    transaction.status,
    transaction.typeInfo.currencyAmountRaw,
    transaction.typeInfo.unwrapped,
    wrappedNativeCurrency,
  ])

  return (
    <TransactionSummaryLayout
      caption={caption}
      endCaption={balanceUpdate?.usdIncrease ?? ''}
      endTitle={balanceUpdate?.assetIncrease ?? ''}
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
      showInlineWarning={showInlineWarning}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
