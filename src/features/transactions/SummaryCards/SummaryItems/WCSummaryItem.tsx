import React from 'react'
import { useTranslation } from 'react-i18next'
import { DappLogoWithWCBadge } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
import { WCConfirmInfo } from 'src/features/transactions/types'

export default function WCSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: WCConfirmInfo } }) {
  const { t } = useTranslation()
  const title = formatTitleWithStatus({
    status: transaction.status,
    text: t('Contract interaction'),
    showInlineWarning,
    t,
  })
  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.dapp.name}
      icon={
        <DappLogoWithWCBadge
          dappImageUrl={transaction.typeInfo.dapp.icon}
          size={TXN_HISTORY_ICON_SIZE}
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
