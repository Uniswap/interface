import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'uniswap/src/entities/assets'
import { isValidIsoCurrencyCode } from 'uniswap/src/features/fiatOnRamp/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  OnRampPurchaseInfo,
  OnRampTransferInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'

export function OnRampTransferSummaryItem({
  transaction,
  isExternalProfile,
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
    // Validate sourceCurrency is a valid 3-letter ISO currency code before formatting
    const currencyCode = purchaseInfo.sourceCurrency
    if (!isValidIsoCurrencyCode(currencyCode)) {
      logger.error(new Error('Invalid sourceCurrency in OnRampPurchaseInfo'), {
        tags: {
          file: 'OnRampTransferSummaryItem.tsx',
          function: 'formatFiatTokenPrice',
        },
        extra: { sourceCurrency: currencyCode, transactionId: purchaseInfo.id },
      })
      return '-'
    }

    try {
      return formatNumberOrString({
        value: purchaseInfo.sourceAmount,
        type: NumberType.FiatTokenPrice,
        currencyCode,
      })
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'OnRampTransferSummaryItem.tsx',
          function: 'formatFiatTokenPrice',
        },
        extra: { sourceCurrency: currencyCode, transactionId: purchaseInfo.id },
      })
      return '-'
    }
  }

  const caption =
    typeInfo.type === TransactionType.OnRampPurchase
      ? t('fiatOnRamp.summary.total', {
          cryptoAmount: cryptoPurchaseAmount,
          fiatAmount: formatFiatTokenPrice(typeInfo),
        })
      : cryptoPurchaseAmount

  const icon = useMemo(
    () => (
      <LogoWithTxStatus
        assetType={AssetType.Currency}
        chainId={transaction.chainId}
        currencyInfo={outputCurrencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={transaction.typeInfo.type}
      />
    ),
    [outputCurrencyInfo, transaction.chainId, transaction.status, transaction.typeInfo.type],
  )

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={icon}
      transaction={transaction}
      isExternalProfile={isExternalProfile}
    />
  )
}
