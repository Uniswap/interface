import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { TradeRoutingPreferenceControl } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreferenceControl'
import { TradeRoutingPreferenceScreen } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreferenceScreen'

export const TradeRoutingPreference: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.settings.routingPreference.title'),
  Control() {
    return <TradeRoutingPreferenceControl />
  },
  Screen() {
    return <TradeRoutingPreferenceScreen />
  },
}
