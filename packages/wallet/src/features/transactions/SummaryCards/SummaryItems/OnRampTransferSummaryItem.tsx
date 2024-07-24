import React, { createElement } from 'react'
import { useTranslation } from 'react-i18next'
import { AssetType } from 'uniswap/src/entities/assets'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { SummaryItemProps, TransactionSummaryLayoutProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import {
  OnRampPurchaseInfo,
  OnRampTransferInfo,
  TransactionDetails,
  TransactionType,
} from 'wallet/src/features/transactions/types'

export function OnRampTransferSummaryItem({
  transaction,
  layoutElement,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: OnRampPurchaseInfo | OnRampTransferInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const { chainId, typeInfo } = transaction
  const { destinationTokenSymbol, destinationTokenAddress, destinationTokenAmount } = typeInfo

  const outputCurrencyInfo = useCurrencyInfo(buildCurrencyId(chainId, destinationTokenAddress))

  const cryptoPurchaseAmount = formatNumberOrString({ value: destinationTokenAmount }) + ' ' + destinationTokenSymbol

  const formatFiatTokenPrice = (purchaseInfo: OnRampPurchaseInfo): string => {
    return formatNumberOrString({
      value: purchaseInfo.sourceAmount > 0 ? purchaseInfo.sourceAmount : undefined,
      type: NumberType.FiatTokenPrice,
      currencyCode: purchaseInfo.sourceCurrency,
    })
  }

  const caption =
    typeInfo.type === TransactionType.OnRampPurchase
      ? t('fiatOnRamp.summary.total', {
          cryptoAmount: cryptoPurchaseAmount,
          fiatAmount: formatFiatTokenPrice(typeInfo),
        })
      : cryptoPurchaseAmount

  return createElement(layoutElement as React.FunctionComponent<TransactionSummaryLayoutProps>, {
    caption,
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
