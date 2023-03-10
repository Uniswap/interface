import React from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import TransactionSummaryLayout, {
  AssetUpdateLayout,
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { getTransactionTitle } from 'src/features/transactions/SummaryCards/utils'
import { FiatPurchaseTransactionInfo } from 'src/features/transactions/types'
import { buildCurrencyId } from 'src/utils/currencyId'
import { formatFiatPrice } from 'src/utils/format'

export default function FiatPurchaseSummaryItem({
  transaction,
  readonly = true,
  ...rest
}: BaseTransactionSummaryProps & {
  transaction: { typeInfo: FiatPurchaseTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()

  const { chainId, typeInfo } = transaction
  const { inputCurrency, inputCurrencyAmount, outputCurrency, outputCurrencyAmount } = typeInfo

  const outputCurrencyInfo = useCurrencyInfo(
    outputCurrency?.metadata.contractAddress
      ? buildCurrencyId(chainId, outputCurrency?.metadata.contractAddress)
      : undefined
  )

  const title = getTransactionTitle(transaction.status, t('Purchase'), t)

  const fiatPurchaseAmount = formatFiatPrice(
    inputCurrencyAmount && inputCurrencyAmount > 0 ? inputCurrencyAmount : undefined,
    inputCurrency?.code
  )
  const caption = fiatPurchaseAmount
    ? `${fiatPurchaseAmount} of ${outputCurrencyInfo?.currency.symbol ?? t('Unknown token')}`
    : ''

  const endAdornment = outputCurrency ? (
    // bypassing BalanceUpdate since we do not have an actual raw amount here
    <AssetUpdateLayout
      caption={fiatPurchaseAmount}
      title={
        '+' + outputCurrencyAmount + ' ' + outputCurrencyInfo?.currency.symbol ?? t('unknown token')
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
          currencyInfo={outputCurrencyInfo}
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
