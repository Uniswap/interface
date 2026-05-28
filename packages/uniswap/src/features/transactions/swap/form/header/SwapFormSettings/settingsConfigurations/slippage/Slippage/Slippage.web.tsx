import {
  TransactionSettingId,
  type TransactionSettingConfig,
} from 'uniswap/src/features/transactions/components/settings/types'
import { SlippageControl } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/SlippageControl/SlippageControl'

export const Slippage: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  renderTooltip: (t) => t('swap.settings.slippage.description'),
  settingId: TransactionSettingId.SLIPPAGE,
  Control() {
    return <SlippageControl saveOnBlur={false} />
  },
}
