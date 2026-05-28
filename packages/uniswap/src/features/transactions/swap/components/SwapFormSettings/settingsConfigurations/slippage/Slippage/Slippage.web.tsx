import { Slippage as SlippageBase } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/Slippage/Slippage.web'
import { type TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { SlippageControl } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippage/SlippageControl/SlippageControl'

export const Slippage: TransactionSettingConfig = {
  ...SlippageBase,
  Control() {
    return <SlippageControl saveOnBlur={false} />
  },
}
