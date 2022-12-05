import React from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import { useCurrency } from 'src/features/tokens/useCurrency'
import TransactionSummaryLayout, {
  AssetUpdateLayout,
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { getTransactionTitle } from 'src/features/transactions/SummaryCards/utils'
import { FiatPurchaseTransactionInfo } from 'src/features/transactions/types'
import { buildCurrencyId } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'

export default function FiatPurchaseSummaryItem({
  transaction,
  readonly = true,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: FiatPurchaseTransactionInfo } }) {
  const { t } = useTranslation()

  const { chainId, typeInfo } = transaction
  const { outputCurrencyAmountFormatted, outputCurrencyAmountPrice, outputTokenAddress } = typeInfo

  const outputCurrency = useCurrency(
    outputTokenAddress ? buildCurrencyId(chainId, outputTokenAddress) : undefined
  )

  const transactedUSDValue =
    outputCurrencyAmountFormatted && outputCurrencyAmountPrice
      ? outputCurrencyAmountPrice * outputCurrencyAmountFormatted
      : undefined

  const title = getTransactionTitle(transaction.status, t('Purchase'), t('Purchased'), t)

  const caption = outputCurrency
    ? `${formatUSDPrice(transactedUSDValue)} of ${outputCurrency.symbol ?? t('Unknown token')}`
    : ''

  const endAdornment =
    outputCurrency && outputCurrencyAmountFormatted ? (
      // bypassing BalanceUpdate since we do not have an actual raw amount here
      <AssetUpdateLayout
        caption={formatUSDPrice(transactedUSDValue)}
        title={
          '+' + outputCurrencyAmountFormatted.toString() + ' ' + outputCurrency.symbol ??
          t('unknown token')
        }
      />
    ) : undefined

  return (
    <TransactionSummaryLayout
      caption={caption}
      endAdornment={endAdornment}
      icon={
        <LogoWithTxStatus
          assetType={AssetType.Currency}
          currency={outputCurrency}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={transaction.typeInfo.type}
        />
      }
      readonly={readonly}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
