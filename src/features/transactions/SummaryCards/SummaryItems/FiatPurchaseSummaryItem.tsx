import React from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { FiatPurchaseTransactionInfo, TransactionDetails } from 'src/features/transactions/types'
import { buildCurrencyId } from 'src/utils/currencyId'
import { formatFiatPrice } from 'src/utils/format'

export default function FiatPurchaseSummaryItem({
  transaction,
}: {
  transaction: TransactionDetails & { typeInfo: FiatPurchaseTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()

  const { chainId, typeInfo } = transaction
  const { inputCurrency, inputCurrencyAmount, outputCurrency, outputCurrencyAmount } = typeInfo

  const outputCurrencyInfo = useCurrencyInfo(
    outputCurrency?.metadata.contractAddress
      ? buildCurrencyId(chainId, outputCurrency?.metadata.contractAddress)
      : undefined
  )

  const fiatPurchaseAmount = formatFiatPrice(
    inputCurrencyAmount && inputCurrencyAmount > 0 ? inputCurrencyAmount : undefined,
    inputCurrency?.code
  )

  return (
    <TransactionSummaryLayout
      caption={t('{{cryptoAmount}} for {{fiatAmount}}', {
        cryptoAmount:
          outputCurrencyAmount + ' ' + (outputCurrencyInfo?.currency.symbol ?? t('unknown token')),
        fiatAmount: fiatPurchaseAmount,
      })}
      icon={
        <LogoWithTxStatus
          assetType={AssetType.Currency}
          chainId={transaction.chainId}
          currencyInfo={outputCurrencyInfo}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={transaction.typeInfo.type}
        />
      }
      transaction={transaction}
    />
  )
}
