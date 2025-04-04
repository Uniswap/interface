import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export const Deadline: SwapSettingConfig = {
  renderTitle: (t) => t('swap.deadline.settings.title.short'),
  Control() {
    throw new PlatformSplitStubError('Deadline')
  },
}
