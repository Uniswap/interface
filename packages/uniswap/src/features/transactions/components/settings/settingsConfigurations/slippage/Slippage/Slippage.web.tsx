import { SlippageControl } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/SlippageControl.web'
import { SlippageWarning } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageWarning'
import {
  TransactionSettingId,
  type TransactionSettingConfig,
} from 'uniswap/src/features/transactions/components/settings/types'

export const Slippage: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  renderTooltip: (t) => t('swap.settings.slippage.description'),
  settingId: TransactionSettingId.SLIPPAGE,
  Control() {
    return <SlippageControl saveOnBlur={false} />
  },
  Warning() {
    return <SlippageWarning />
  },
}
