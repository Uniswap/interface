import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { Slippage } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippage/Slippage/Slippage'

// On native, the update slippage popup is the same as the usual tx settings update modal.
export const SlippageUpdate: TransactionSettingConfig = {
  ...Slippage,
}
