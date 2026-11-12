import { Platform } from '@universe/chains'
import { FeatureFlags } from '@universe/gating'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { BridgingOptionsControl } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/BridgingOptions/BridgingOptionsControl'
import { BridgingOptionsScreen } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/BridgingOptions/BridgingOptionsScreen'

export const BridgingOptions: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.settings.bridgingOptions.title'),
  applicablePlatforms: [Platform.EVM],
  // Without the gate quotes list no vendor and the Trading API serves Across only, so there is nothing to choose.
  featureFlag: FeatureFlags.RelayBridgeAggregator,
  Control() {
    return <BridgingOptionsControl />
  },
  Screen() {
    return <BridgingOptionsScreen />
  },
}
