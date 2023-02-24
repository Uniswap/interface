import { TFunction } from 'i18next'
import { TransactionStatus } from 'src/features/transactions/types'

export function getTransactionTitle(
  status: TransactionStatus,
  presentText: string, // present tense form of the title
  pastText: string | undefined, // past tense form of the title
  t: TFunction
): string {
  const prefixFail = status === TransactionStatus.Failed ? t('Failed') : ''

  // For items with pending or alert banner UI (see AlertBanner.tsx), use present tense.
  const isPresentTense =
    status === TransactionStatus.Pending ||
    status === TransactionStatus.Cancelling ||
    status === TransactionStatus.Cancelled ||
    !!prefixFail

  const baseText = isPresentTense || !pastText ? presentText : pastText

  // Lowercase title if prefix
  const title =
    prefixFail + (prefixFail ? ' ' : '') + (prefixFail ? baseText.toLocaleLowerCase() : baseText)

  return title
}
