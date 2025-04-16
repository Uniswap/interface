import { Slippage } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/Slippage/Slippage'
import type { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/types'

// On native, the update slippage popup is the same as the usual tx settings update modal.
export const SlippageUpdate: SwapSettingConfig = {
  ...Slippage,
  renderCloseButtonText: (t): string => t('common.button.save'),
}
