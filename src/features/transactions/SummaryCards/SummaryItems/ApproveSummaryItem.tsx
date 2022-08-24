import React from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import { useCurrency } from 'src/features/tokens/useCurrency'
import TransactionSummaryLayout from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import {
  BaseTransactionSummaryProps,
  TXN_HISTORY_SIZING,
} from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
import { ApproveTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { shortenAddress } from 'src/utils/addresses'
import { buildCurrencyId } from 'src/utils/currencyId'

export default function ApproveSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: ApproveTransactionInfo } }) {
  const { t } = useTranslation()
  const currency = useCurrency(
    buildCurrencyId(transaction.chainId, transaction.typeInfo.tokenAddress)
  )
  const title = formatTitleWithStatus({
    status: transaction.status,
    text: t('Approve'),
    showInlineWarning,
    t,
  })
  return (
    <TransactionSummaryLayout
      caption={shortenAddress(transaction.typeInfo.spender)}
      endTitle={currency?.symbol}
      icon={
        <LogoWithTxStatus
          assetType={AssetType.Currency}
          currency={currency}
          size={TXN_HISTORY_SIZING}
          txStatus={transaction.status}
          txType={TransactionType.Approve}
        />
      }
      readonly={readonly}
      showInlineWarning={showInlineWarning}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
