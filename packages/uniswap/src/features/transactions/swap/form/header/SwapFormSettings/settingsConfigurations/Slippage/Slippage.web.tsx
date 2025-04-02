import {
  SwapSettingId,
  type SwapSettingConfig,
} from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/types'
import { SlippageControl } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/SlippageControl'

export const Slippage: SwapSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  renderTooltip: (t) => t('swap.settings.slippage.description'),
  settingId: SwapSettingId.SLIPPAGE,
  Control() {
    return <SlippageControl saveOnBlur={false} />
  },
}
