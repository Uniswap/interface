import { DynamicConfigs, ForceUpgradeConfigKey, ForceUpgradeStatus, useDynamicConfigValue } from '@universe/gating'

export function useForceUpgradeStatus(): ForceUpgradeStatus {
  return useDynamicConfigValue({
    config: DynamicConfigs.ForceUpgrade,
    key: ForceUpgradeConfigKey.Status,
    defaultValue: 'not-required',
  })
}
