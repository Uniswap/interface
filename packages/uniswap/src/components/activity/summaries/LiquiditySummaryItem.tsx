import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { ContractInteraction } from 'ui/src/components/icons/ContractInteraction'
import { iconSizes } from 'ui/src/theme'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { DappLogoWithWCBadge, LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { AssetType } from 'uniswap/src/entities/assets'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  CollectFeesTransactionInfo,
  CreatePairTransactionInfo,
  CreatePoolTransactionInfo,
  LiquidityDecreaseTransactionInfo,
  LiquidityIncreaseTransactionInfo,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'

export function LiquiditySummaryItem({
  transaction,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & {
    typeInfo:
      | LiquidityIncreaseTransactionInfo
      | LiquidityDecreaseTransactionInfo
      | CollectFeesTransactionInfo
      | CreatePairTransactionInfo
      | CreatePoolTransactionInfo
  }
}): JSX.Element {
  const { typeInfo } = transaction
  const { t } = useTranslation()
  const formatter = useLocalizationContext()
  const colors = useSporeColors()

  const currency0Info = useCurrencyInfo(typeInfo.currency0Id)
  const currency1Info = useCurrencyInfo(typeInfo.currency1Id)

  const caption = useMemo(() => {
    const formatCurrencyAmount = (currencyInfo: typeof currency0Info, amountRaw: string): string | null => {
      if (!currencyInfo) {
        return null
      }

      const { currency } = currencyInfo
      const amount = getFormattedCurrencyAmount({ currency, amount: amountRaw, formatter })
      return `${amount}${getSymbolDisplayText(currency.symbol)}`
    }

    const inputFormatted = formatCurrencyAmount(currency0Info, typeInfo.currency0AmountRaw)
    const outputFormatted = formatCurrencyAmount(currency1Info, typeInfo.currency1AmountRaw ?? '0')

    if (inputFormatted && outputFormatted) {
      return t('transaction.summary.liquidity', {
        firstAmountWithSymbol: inputFormatted,
        secondAmountWithSymbol: outputFormatted,
      })
    }

    return inputFormatted || outputFormatted || typeInfo.dappInfo?.name || ''
  }, [typeInfo, currency0Info, currency1Info, formatter, t])

  const icon = useMemo(() => {
    if (currency0Info && currency1Info) {
      return (
        <SplitLogo
          chainId={transaction.chainId}
          inputCurrencyInfo={currency0Info}
          outputCurrencyInfo={currency1Info}
          size={TXN_HISTORY_ICON_SIZE}
        />
      )
    }

    if (currency1Info || currency0Info) {
      return (
        <LogoWithTxStatus
          assetType={AssetType.Currency}
          chainId={transaction.chainId}
          currencyInfo={currency1Info || currency0Info}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={typeInfo.type}
        />
      )
    }

    if (transaction.typeInfo.dappInfo) {
      return (
        <DappLogoWithWCBadge
          hideWCBadge
          chainId={transaction.chainId}
          dappImageUrl={transaction.typeInfo.dappInfo.icon}
          dappName={transaction.typeInfo.dappInfo.name ?? ''}
          size={iconSizes.icon40}
        />
      )
    }

    return <ContractInteraction color="$neutral2" fill={colors.surface1.get()} size="$icon.40" />
  }, [colors.surface1, currency0Info, currency1Info, transaction, typeInfo.type])

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={icon}
      index={index}
      transaction={transaction}
      isExternalProfile={isExternalProfile}
    />
  )
}
