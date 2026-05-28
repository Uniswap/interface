import { DynamicConfigs, ForceUpgradeConfigKey, ForceUpgradeStatus } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

export function useForceUpgradeStatus(): ForceUpgradeStatus {
  return useDynamicConfigValue<DynamicConfigs.ForceUpgrade, ForceUpgradeConfigKey, ForceUpgradeStatus>(
    DynamicConfigs.ForceUpgrade,
    ForceUpgradeConfigKey.Status,
    'not-required',
  )
}
