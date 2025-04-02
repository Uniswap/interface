import { Deadline } from 'uniswap/src/features/transactions/swap/settings/configs/Deadline.web'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'

// default deadline setting is overridden to use a custom title
export const DeadlineOverride: SwapSettingConfig = {
  ...Deadline,
  renderTitle: (t) => t('swap.deadline.settings.title'),
}
