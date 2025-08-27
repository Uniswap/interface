import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { TradeRoutingPreferenceControl } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreferenceControl'
import { TradeRoutingPreferenceScreen } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreferenceScreen'

export const TradeRoutingPreference: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.settings.routingPreference.title'),
  applicablePlatforms: [Platform.EVM],
  Control() {
    return <TradeRoutingPreferenceControl />
  },
  Screen() {
    return <TradeRoutingPreferenceScreen />
  },
}
