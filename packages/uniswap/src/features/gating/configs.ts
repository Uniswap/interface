import { isInterface } from 'uniswap/src/utils/platform'
import { logger } from 'utilities/src/logger/logger'

/**
 * Dynamic Configs
 * These should match the dynamic config's `Config Name` on Statsig
 */
export enum DynamicConfigs {
  // Wallet
  MobileForceUpgrade,
  Slippage,
  UwuLink,

  // Web
  QuickRouteChains,
}

export const WEB_CONFIG_NAMES = new Map<DynamicConfigs, string>([
  [DynamicConfigs.QuickRouteChains, 'quick_route_chains'],
])

export const WALLET_CONFIG_NAMES = new Map<DynamicConfigs, string>([
  [DynamicConfigs.MobileForceUpgrade, 'force_upgrade'],
  [DynamicConfigs.UwuLink, 'uwulink_config'],
  [DynamicConfigs.Slippage, 'slippage_configs'],
])

export function getConfigName(config: DynamicConfigs): string {
  const names = isInterface ? WEB_CONFIG_NAMES : WALLET_CONFIG_NAMES
  const name = names.get(config)
  if (!name) {
    const err = new Error(
      `Dynamic config ${DynamicConfigs[config]} does not have a name mapped for this application`
    )
    logger.error(err, {
      tags: {
        file: 'configs.ts',
        function: 'getConfigName',
      },
    })
    throw err
  }

  return name
}
