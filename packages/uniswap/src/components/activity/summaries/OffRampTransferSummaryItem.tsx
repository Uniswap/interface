import { useTranslation } from 'react-i18next'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'uniswap/src/entities/assets'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { OffRampSaleInfo, TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export function OffRampTransferSummaryItem({
  transaction,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: OffRampSaleInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const { chainId, typeInfo } = transaction
  const { destinationTokenSymbol, destinationTokenAddress, destinationTokenAmount } = typeInfo

  const outputCurrencyInfo = useCurrencyInfo(buildCurrencyId(chainId, destinationTokenAddress))
  const cryptoAmount = `${typeInfo.sourceAmount ?? ''} ${getSymbolDisplayText(typeInfo.sourceCurrency)}`
  const cryptoSaleAmount = formatNumberOrString({ value: destinationTokenAmount }) + ' ' + destinationTokenSymbol

  return (
    <TransactionSummaryLayout
      caption={t('fiatOffRamp.summary.total', {
        cryptoAmount,
        fiatAmount: destinationTokenAmount === 0 ? destinationTokenSymbol : cryptoSaleAmount,
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
      isExternalProfile={isExternalProfile}
    />
  )
}
