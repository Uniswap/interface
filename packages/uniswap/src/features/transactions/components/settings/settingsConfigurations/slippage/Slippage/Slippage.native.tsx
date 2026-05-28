import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { SlippageControl } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/SlippageControl'
import { SlippageWarning } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageWarning'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'

export const Slippage: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  applicablePlatforms: [Platform.EVM, Platform.SVM],
  Control() {
    return <SlippageControl />
  },
  Warning() {
    return <SlippageWarning />
  },
}
