import type { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'

/**
 * Filters transaction settings to only include those applicable to the specified platform
 * @param settings Array of transaction setting configs
 * @param platform The platform to filter for
 * @returns Filtered array of settings applicable to the platform
 */
export function filterSettingsByPlatform(
  settings: TransactionSettingConfig[],
  platform: Platform,
): TransactionSettingConfig[] {
  return settings.filter((setting) => setting.applicablePlatforms.includes(platform))
}
