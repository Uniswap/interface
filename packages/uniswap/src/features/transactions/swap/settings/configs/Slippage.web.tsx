import { SlippageControl } from 'uniswap/src/features/transactions/swap/settings/SlippageControl'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'

export const Slippage: SwapSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  Control() {
    return <SlippageControl saveOnBlur={false} />
  },
}
