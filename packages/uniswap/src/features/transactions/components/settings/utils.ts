import { TradingApi } from '@universe/api'
import type { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'

// Returns true if the setting is applicable to the trade routing, false otherwise
export function getShouldSettingApplyToRouting(
  setting: TransactionSettingConfig,
  tradeRouting?: TradingApi.Routing,
): boolean {
  return !(setting.inapplicableTradeRouting && tradeRouting && setting.inapplicableTradeRouting.includes(tradeRouting))
}

/**
 * Filters transaction settings to only include those applicable to the specified platform and trade routing
 * @param settings Array of transaction setting configs
 * @param filter The platform and trade routing to filter for
 * @returns Filtered array of settings
 */
export function filterSettingsByPlatformAndTradeRouting(
  settings: TransactionSettingConfig[],
  filter: {
    platform: Platform
    tradeRouting?: TradingApi.Routing
  },
): TransactionSettingConfig[] {
  const { platform, tradeRouting } = filter
  return settings.filter(
    (setting) =>
      setting.applicablePlatforms.includes(platform) && getShouldSettingApplyToRouting(setting, tradeRouting),
  )
}
