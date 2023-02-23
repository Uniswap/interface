import React from 'react'
import { useTranslation } from 'react-i18next'
import { DappLogoWithWCBadge } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { getTransactionTitle } from 'src/features/transactions/SummaryCards/utils'
import { WCConfirmInfo } from 'src/features/transactions/types'

export default function WCSummaryItem({
  transaction,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: WCConfirmInfo } }): JSX.Element {
  const { t } = useTranslation()
  const title = getTransactionTitle(
    transaction.status,
    t('Contract Interaction'),
    undefined /*=pastText*/,
    t
  )
  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.dapp.name}
      icon={
        <DappLogoWithWCBadge
          dappImageUrl={transaction.typeInfo.dapp.icon}
          dappName={transaction.typeInfo.dapp.name}
          size={TXN_HISTORY_ICON_SIZE}
        />
      }
      readonly={readonly}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
