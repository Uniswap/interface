import type { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export const Slippage: SwapSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  Control() {
    throw new PlatformSplitStubError('Slippage')
  },
}
