import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { Slippage } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippage/Slippage/Slippage'
import { SlippageControl } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippage/SlippageControl/SlippageControl'

export const SlippageUpdate: TransactionSettingConfig = {
  ...Slippage,
  hideTitle: true,
  Control() {
    return <SlippageControl saveOnBlur={true} />
  },
}
