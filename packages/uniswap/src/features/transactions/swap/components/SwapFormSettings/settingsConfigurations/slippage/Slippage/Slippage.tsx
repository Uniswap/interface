import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export const Slippage: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  Control() {
    throw new PlatformSplitStubError('Slippage')
  },
  Warning() {
    throw new PlatformSplitStubError('Slippage')
  },
}
