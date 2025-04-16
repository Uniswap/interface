import type { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export const Deadline: SwapSettingConfig = {
  renderTitle: (t) => t('swap.deadline.settings.title.short'),
  Control() {
    throw new PlatformSplitStubError('Deadline')
  },
}
