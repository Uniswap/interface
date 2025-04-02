import { Deadline } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/Deadline/Deadline.web'
import type { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/types'

// default deadline setting is overridden to use a custom title
export const DeadlineOverride: SwapSettingConfig = {
  ...Deadline,
  renderTitle: (t) => t('swap.deadline.settings.title'),
}
