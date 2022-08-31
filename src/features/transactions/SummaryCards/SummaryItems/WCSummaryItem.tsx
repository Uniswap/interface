import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { RemoteImage } from 'src/components/images/RemoteImage'
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
  const theme = useAppTheme()
  const title = formatTitleWithStatus({
    status: transaction.status,
    text: t('Contract Interaction'),
    showInlineWarning,
    t,
  })
  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.dapp.name}
      icon={
        <RemoteImage
          borderRadius={theme.borderRadii.full}
          height={TXN_HISTORY_ICON_SIZE}
          uri={transaction.typeInfo.dapp.icon ?? ''}
          width={TXN_HISTORY_ICON_SIZE}
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
