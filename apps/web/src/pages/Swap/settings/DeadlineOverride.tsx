import { Deadline } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/Deadline/Deadline'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'

// default deadline setting is overridden to use a custom title
export const DeadlineOverride: TransactionSettingConfig = {
  ...Deadline,
  renderTitle: (t) => t('swap.deadline.settings.title'),
}
