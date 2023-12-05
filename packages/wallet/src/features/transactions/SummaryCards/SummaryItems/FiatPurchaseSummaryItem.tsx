import React, { createElement } from 'react'
import { useTranslation } from 'react-i18next'
import { NumberType } from 'utilities/src/format/types'
import { LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'wallet/src/entities/assets'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import {
  SummaryItemProps,
  TransactionSummaryLayoutProps,
} from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import {
  FiatPurchaseTransactionInfo,
  TransactionDetails,
} from 'wallet/src/features/transactions/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

export function FiatPurchaseSummaryItem({
  transaction,
  layoutElement,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: FiatPurchaseTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const { chainId, typeInfo } = transaction
  const { inputCurrency, inputCurrencyAmount, outputCurrency, outputCurrencyAmount } = typeInfo

  const outputCurrencyInfo = useCurrencyInfo(
    outputCurrency?.metadata.contractAddress
      ? buildCurrencyId(chainId, outputCurrency?.metadata.contractAddress)
      : undefined
  )

  const fiatPurchaseAmount = formatNumberOrString({
    value: inputCurrencyAmount && inputCurrencyAmount > 0 ? inputCurrencyAmount : undefined,
    type: NumberType.FiatTokenPrice,
    currencyCode: inputCurrency?.code ?? 'usd',
  })

  const symbol = getSymbolDisplayText(outputCurrencyInfo?.currency.symbol) ?? t('unknown token')

  return createElement(layoutElement as React.FunctionComponent<TransactionSummaryLayoutProps>, {
    caption:
      outputCurrencyAmount !== undefined && outputCurrencyAmount !== null
        ? t('{{cryptoAmount}} for {{fiatAmount}}', {
            cryptoAmount: formatNumberOrString({ value: outputCurrencyAmount }) + ' ' + symbol,
            fiatAmount: fiatPurchaseAmount,
          })
        : fiatPurchaseAmount,
    icon: (
      <LogoWithTxStatus
        assetType={AssetType.Currency}
        chainId={transaction.chainId}
        currencyInfo={outputCurrencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={transaction.typeInfo.type}
      />
    ),
    transaction,
  })
}
