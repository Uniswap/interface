import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { SlippageControl } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/SlippageControl/SlippageControl'
import { SlippageScreenNative } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/SlippageScreenNative'

export const Slippage: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  Control() {
    return <SlippageControl saveOnBlur={false} />
  },
  Screen() {
    return <SlippageScreenNative />
  },
}
