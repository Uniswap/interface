import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export const Slippage: SwapSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  Control() {
    throw new PlatformSplitStubError('Slippage')
  },
}
