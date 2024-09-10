import { PlatformSplitStubError } from 'utilities/src/errors'
import { SwapSettingConfig } from 'wallet/src/features/transactions/swap/modals/settings/configs/types'

export const Slippage: SwapSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  Control() {
    throw new PlatformSplitStubError('Slippage')
  },
}
