import { useMemo } from 'react'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'uniswap/src/entities/assets'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionDetails, WithdrawTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export function WithdrawSummaryItem({
  transaction,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: WithdrawTransactionInfo }
}): JSX.Element {
  const formatter = useLocalizationContext()
  const { typeInfo } = transaction

  const currencyInfo = useCurrencyInfo(buildCurrencyId(transaction.chainId, typeInfo.tokenAddress))

  const caption = useMemo(() => {
    if (!currencyInfo) {
      return typeInfo.dappInfo?.name ?? ''
    }

    const currencyAmount = typeInfo.currencyAmountRaw
      ? getFormattedCurrencyAmount({
          currency: currencyInfo.currency,
          amount: typeInfo.currencyAmountRaw,
          formatter,
        })
      : ''

    const symbol = getSymbolDisplayText(currencyInfo.currency.symbol) ?? ''
    const tokenText = `${currencyAmount}${symbol}`

    if (typeInfo.dappInfo?.name) {
      return `${tokenText} from ${typeInfo.dappInfo.name}`
    }

    return tokenText
  }, [currencyInfo, typeInfo.currencyAmountRaw, typeInfo.dappInfo?.name, formatter])

  const icon = useMemo(
    () => (
      <LogoWithTxStatus
        assetType={AssetType.Currency}
        chainId={transaction.chainId}
        currencyInfo={currencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={transaction.typeInfo.type}
      />
    ),
    [currencyInfo, transaction.chainId, transaction.status, transaction.typeInfo.type],
  )

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
