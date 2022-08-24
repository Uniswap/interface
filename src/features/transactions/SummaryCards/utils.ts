import { TFunction } from 'i18next'
import { TransactionStatus } from 'src/features/transactions/types'

export function formatTitleWithStatus({
  status,
  text,
  t,
  showInlineWarning,
}: {
  status: TransactionStatus
  text: string
  t: TFunction
  showInlineWarning?: boolean
}) {
  const prefix =
    status === TransactionStatus.Failed
      ? 'Failed '
      : status === TransactionStatus.Cancelled && showInlineWarning
      ? 'Canceled '
      : status === TransactionStatus.Cancelling && showInlineWarning
      ? 'Canceling '
      : ''
  // Lowercase title if prefix
  const textString = prefix + (prefix ? text.toLocaleLowerCase() : text)
  return t(textString)
}
