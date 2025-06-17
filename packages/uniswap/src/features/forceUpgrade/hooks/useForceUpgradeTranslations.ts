import { DynamicConfigs, ForceUpgradeConfigKey, ForceUpgradeTranslations } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

export function useForceUpgradeTranslations(): ForceUpgradeTranslations {
  return useDynamicConfigValue({
    config: DynamicConfigs.ForceUpgrade,
    key: ForceUpgradeConfigKey.Translations,
    defaultValue: {},
  })
}
