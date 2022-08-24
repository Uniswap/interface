import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import UnknownStatus from 'src/assets/icons/question-in-circle.svg'
import TransactionSummaryLayout from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
import { UnknownTransactionInfo } from 'src/features/transactions/types'
import { isValidAddress, shortenAddress } from 'src/utils/addresses'

export default function UnknownSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & { transaction: { typeInfo: UnknownTransactionInfo } }) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const title = formatTitleWithStatus({
    status: transaction.status,
    text: t('Contract Interaction'),
    showInlineWarning,
    t,
  })

  const caption = useMemo(() => {
    return transaction.typeInfo.tokenAddress && isValidAddress(transaction.typeInfo.tokenAddress)
      ? shortenAddress(transaction.typeInfo.tokenAddress)
      : undefined
  }, [transaction.typeInfo.tokenAddress])

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={
        <UnknownStatus
          color={theme.colors.textSecondary}
          fill={theme.colors.backgroundBackdrop}
          height={theme.spacing.lg}
          width={theme.spacing.lg}
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
