import { DynamicConfigs, ForceUpgradeConfigKey, ForceUpgradeTranslations } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

export function useForceUpgradeTranslations(): ForceUpgradeTranslations {
  return useDynamicConfigValue<DynamicConfigs.ForceUpgrade, ForceUpgradeConfigKey, ForceUpgradeTranslations>(
    DynamicConfigs.ForceUpgrade,
    ForceUpgradeConfigKey.Translations,
    {},
  )
}
