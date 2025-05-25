import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { Deadline } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/deadline/Deadline/Deadline'

// default deadline setting is overridden to use a custom title
export const DeadlineOverride: TransactionSettingConfig = {
  ...Deadline,
  renderTitle: (t) => t('swap.deadline.settings.title'),
}
