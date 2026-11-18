import { WarningLine } from '@universe/transactions-ui'
import { useTranslation } from 'react-i18next'
import { WARNING_DEADLINE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'

export function DeadlineWarning(): JSX.Element | null {
  const { t } = useTranslation()
  const customDeadline = useTransactionSettingsStore((state) => state.customDeadline)

  if (!customDeadline) {
    return null
  }

  if (customDeadline >= WARNING_DEADLINE_TOLERANCE) {
    return <WarningLine message={t('swap.settings.deadline.warning')} level="warning" />
  }

  return null
}
