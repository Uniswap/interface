import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from 'src/components/layout/Box'
import { Toast, ToastVariant } from 'src/components/notifications/Toast'
import { usePendingTransactions } from 'src/features/transactions/hooks'
import { TransactionDetails, TransactionType } from 'src/features/transactions/types'

export function TransactionStatusBanner() {
  return (
    <Box>
      <TransactionStatus />
    </Box>
  )
}

function TransactionStatus() {
  const { pendingTransactions, recentlyFailedTransactions, recentlySuccessfulTransactions } =
    usePendingTransactions()

  const { t } = useTranslation()

  if (recentlyFailedTransactions.length > 0) {
    return (
      <Box p="sm">
        <Toast
          label={getNotificationName(recentlyFailedTransactions[0], t) + t(' failed')}
          // TODO: actually format these
          variant={ToastVariant.Failed}
        />
      </Box>
    )
  } else if (recentlySuccessfulTransactions.length > 0) {
    return (
      <Box p="sm">
        <Toast
          label={getNotificationName(recentlySuccessfulTransactions[0], t) + t(' successful!')}
          variant={ToastVariant.Success}
        />
      </Box>
    )
  } else if (pendingTransactions.length > 0) {
    return (
      <Box p="sm">
        <Toast
          label={
            pendingTransactions.length +
            ' ' +
            t('pending') +
            ' ' +
            getNotificationName(pendingTransactions[0], t).toLowerCase()
          }
          variant={ToastVariant.Pending}
        />
      </Box>
    )
  }

  return null
}

export function getNotificationName(transaction: TransactionDetails, t: TFunction) {
  switch (transaction.typeInfo.type) {
    case TransactionType.APPROVE:
      return t('Approve')
    case TransactionType.SWAP:
      return t('Swap')
    case TransactionType.WRAP:
      return transaction.typeInfo.unwrapped ? t('Unwrapped') : t('Wrap')
  }

  return t('Transaction')
}
