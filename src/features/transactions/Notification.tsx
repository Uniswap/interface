import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Toast } from 'src/components/notifications/Toast'
import { usePendingTransactions } from 'src/features/transactions/hooks'
import { TransactionDetails, TransactionType } from 'src/features/transactions/types'

export function TransactionNotificationBanner() {
  return (
    <CenterBox>
      <TransactionNotification />
    </CenterBox>
  )
}

function TransactionNotification() {
  const { pendingTransactions, recentlyFailedTransactions, recentlySuccessfulTransactions } =
    usePendingTransactions()

  const { t } = useTranslation()

  if (recentlyFailedTransactions.length > 0) {
    return (
      <Toast
        variant="failed"
        // TODO: actually format these
        label={getNotificationName(recentlyFailedTransactions[0], t) + t(' failed')}
      />
    )
  } else if (recentlySuccessfulTransactions.length > 0) {
    return (
      <Toast
        variant="successful"
        label={getNotificationName(recentlySuccessfulTransactions[0], t) + t(' successful!')}
      />
    )
  } else if (pendingTransactions.length > 0) {
    return (
      <Toast
        variant="pending"
        label={
          pendingTransactions.length +
          ' ' +
          t('pending') +
          ' ' +
          getNotificationName(pendingTransactions[0], t).toLowerCase()
        }
      />
    )
  }

  return null
}

function getNotificationName(transaction: TransactionDetails, t: TFunction) {
  switch (transaction.info.type) {
    case TransactionType.APPROVE:
      return t('Approve')
    case TransactionType.SWAP:
      return t('Swap')
    case TransactionType.WRAP:
      return transaction.info.unwrapped ? t('Unwrapped') : t('Wrap')
  }

  return t('Transaction')
}
