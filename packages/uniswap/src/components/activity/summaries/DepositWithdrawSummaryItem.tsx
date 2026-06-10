import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'uniswap/src/entities/assets'
import { getDepositWithdrawDisplayCurrencyId } from 'uniswap/src/features/activity/utils/getDepositWithdrawDisplayCurrencyId'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  DepositTransactionInfo,
  TransactionDetails,
  TransactionType,
  WithdrawTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'

export function WithdrawSummaryItem({
  transaction,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: WithdrawTransactionInfo }
}): JSX.Element {
  return <DepositWithdrawSummaryItem transaction={transaction} index={index} isExternalProfile={isExternalProfile} />
}

export function DepositSummaryItem({
  transaction,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: DepositTransactionInfo }
}): JSX.Element {
  return <DepositWithdrawSummaryItem transaction={transaction} index={index} isExternalProfile={isExternalProfile} />
}

function DepositWithdrawSummaryItem({
  transaction,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & {
    typeInfo: DepositTransactionInfo | WithdrawTransactionInfo
  }
}): JSX.Element {
  const formatter = useLocalizationContext()
  const { t } = useTranslation()
  const { typeInfo } = transaction

  const currencyInfo = useCurrencyInfo(getDepositWithdrawDisplayCurrencyId({ chainId: transaction.chainId, typeInfo }))

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
      const params = { tokenText, externalDappName: typeInfo.dappInfo.name }
      return typeInfo.type === TransactionType.Deposit
        ? t('transaction.summary.deposit.captionDapp', params)
        : t('transaction.summary.withdraw.captionDapp', params)
    }

    return tokenText
  }, [currencyInfo, typeInfo.currencyAmountRaw, typeInfo.dappInfo?.name, typeInfo.type, formatter, t])

  const icon = useMemo(
    () => (
      <LogoWithTxStatus
        assetType={AssetType.Currency}
        chainId={transaction.chainId}
        currencyInfo={currencyInfo}
        isVaultTransaction={typeInfo.isVault}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={transaction.typeInfo.type}
      />
    ),
    [currencyInfo, transaction.chainId, transaction.status, transaction.typeInfo.type, typeInfo.isVault],
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
