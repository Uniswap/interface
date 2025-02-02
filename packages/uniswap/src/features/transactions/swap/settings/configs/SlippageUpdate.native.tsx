import { Slippage } from 'uniswap/src/features/transactions/swap/settings/configs/Slippage'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'

// On native, the update slippage popup is the same as the usual tx settings update modal.
export const SlippageUpdate: SwapSettingConfig = {
  ...Slippage,
  renderCloseButtonText: (t): string => t('common.button.save'),
}
