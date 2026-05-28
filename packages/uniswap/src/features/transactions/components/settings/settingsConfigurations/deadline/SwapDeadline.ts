import { Deadline } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/Deadline/Deadline'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'

export const SwapDeadline: TransactionSettingConfig = {
  ...Deadline,
  renderTitle: (t) => t('swap.deadline.settings.title'),
}
