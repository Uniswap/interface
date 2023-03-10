import { TFunction } from 'i18next'
import { TransactionStatus } from 'src/features/transactions/types'

export function getTransactionTitle(status: TransactionStatus, text: string, t: TFunction): string {
  let prefix = ''
  let suffix = ''

  switch (status) {
    case TransactionStatus.Cancelling:
      prefix = t('Canceling')
      break
    case TransactionStatus.Failed:
      suffix = t('failed')
      break
    case TransactionStatus.Cancelled:
      suffix = t('canceled')
      break
    default:
      break
  }

  const title = [prefix, prefix ? text.toLowerCase() : text, suffix]
    .filter(Boolean) // remove prefix or suffix when undefined
    .join(' ') // add space in between each

  return title
}
