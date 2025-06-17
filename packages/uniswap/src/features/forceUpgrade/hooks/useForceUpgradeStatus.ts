import { DynamicConfigs, ForceUpgradeConfigKey, ForceUpgradeStatus } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

export function useForceUpgradeStatus(): ForceUpgradeStatus {
  return useDynamicConfigValue({
    config: DynamicConfigs.ForceUpgrade,
    key: ForceUpgradeConfigKey.Status,
    defaultValue: 'not-required',
  })
}
