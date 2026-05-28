import {
  DynamicConfigs,
  ForceUpgradeConfigKey,
  ForceUpgradeTranslations,
  useDynamicConfigValue,
} from '@universe/gating'

export function useForceUpgradeTranslations(): ForceUpgradeTranslations {
  return useDynamicConfigValue({
    config: DynamicConfigs.ForceUpgrade,
    key: ForceUpgradeConfigKey.Translations,
    defaultValue: {},
  })
}
