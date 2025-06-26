import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { ContractInteraction } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { AssetType } from 'uniswap/src/entities/assets'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  ClaimTransactionInfo,
  CreatePairTransactionInfo,
  CreatePoolTransactionInfo,
  LiquidityDecreaseTransactionInfo,
  LiquidityIncreaseTransactionInfo,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { DappLogoWithWCBadge, LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { TransactionSummaryLayout } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'

export function LiquiditySummaryItem({
  transaction,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & {
    typeInfo:
      | LiquidityIncreaseTransactionInfo
      | LiquidityDecreaseTransactionInfo
      | ClaimTransactionInfo
      | CreatePairTransactionInfo
      | CreatePoolTransactionInfo
  }
}): JSX.Element {
  const { typeInfo } = transaction
  const { t } = useTranslation()
  const formatter = useLocalizationContext()
  const colors = useSporeColors()

  const inputCurrencyInfo = useCurrencyInfo(typeInfo.inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(typeInfo.outputCurrencyId)

  const caption = useMemo(() => {
    const formatCurrencyAmount = (currencyInfo: typeof inputCurrencyInfo, amountRaw: string): string | null => {
      if (!currencyInfo) {
        return null
      }

      const { currency } = currencyInfo
      const amount = getFormattedCurrencyAmount({ currency, amount: amountRaw, formatter })
      return `${amount}${getSymbolDisplayText(currency.symbol)}`
    }

    const inputFormatted = formatCurrencyAmount(inputCurrencyInfo, typeInfo.inputCurrencyAmountRaw ?? '0')
    const outputFormatted = formatCurrencyAmount(outputCurrencyInfo, typeInfo.outputCurrencyAmountRaw ?? '0')

    if (inputFormatted && outputFormatted) {
      return t('transaction.summary.liquidity', {
        firstAmountWithSymbol: inputFormatted,
        secondAmountWithSymbol: outputFormatted,
      })
    }

    return inputFormatted || outputFormatted || typeInfo.dappInfo?.name || ''
  }, [typeInfo, inputCurrencyInfo, outputCurrencyInfo, formatter, t])

  const icon = useMemo(() => {
    if (inputCurrencyInfo && outputCurrencyInfo) {
      return (
        <SplitLogo
          chainId={transaction.chainId}
          inputCurrencyInfo={inputCurrencyInfo}
          outputCurrencyInfo={outputCurrencyInfo}
          size={TXN_HISTORY_ICON_SIZE}
        />
      )
    }

    if (outputCurrencyInfo || inputCurrencyInfo) {
      return (
        <LogoWithTxStatus
          assetType={AssetType.Currency}
          chainId={transaction.chainId}
          currencyInfo={outputCurrencyInfo || inputCurrencyInfo}
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
  }, [colors.surface1, inputCurrencyInfo, outputCurrencyInfo, transaction, typeInfo.type])

  return <TransactionSummaryLayout caption={caption} icon={icon} index={index} transaction={transaction} />
}
