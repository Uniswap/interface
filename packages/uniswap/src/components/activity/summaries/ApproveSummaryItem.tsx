import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'uniswap/src/entities/assets'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  ApproveTransactionInfo,
  INFINITE_APPROVAL_AMOUNT,
  REVOKE_APPROVAL_AMOUNT,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

export function ApproveSummaryItem({
  transaction,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: ApproveTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(buildCurrencyId(transaction.chainId, transaction.typeInfo.tokenAddress))

  const { approvalAmount } = transaction.typeInfo

  const amount =
    approvalAmount === INFINITE_APPROVAL_AMOUNT
      ? t('transaction.amount.unlimited')
      : approvalAmount && approvalAmount !== REVOKE_APPROVAL_AMOUNT
        ? formatNumberOrString({ value: approvalAmount, type: NumberType.TokenNonTx })
        : ''

  const caption = `${amount ? amount + ' ' : ''}${getSymbolDisplayText(currencyInfo?.currency.symbol) ?? ''}`

  const icon = useMemo(
    () => (
      <LogoWithTxStatus
        assetType={AssetType.Currency}
        chainId={transaction.chainId}
        currencyInfo={currencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={TransactionType.Approve}
      />
    ),
    [currencyInfo, transaction.chainId, transaction.status],
  )

  return <TransactionSummaryLayout caption={caption} icon={icon} index={index} transaction={transaction} />
}
