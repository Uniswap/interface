import {
  DeepLinkUrlAllowlist,
  DeepLinkUrlAllowlistConfigKey,
  DynamicConfigs,
  getDynamicConfigValue,
  UwULinkAllowlist,
  UwuLinkConfigKey,
} from '@universe/gating'
import { isUwULinkAllowlistType } from 'uniswap/src/features/gating/typeGuards'

/**
 * Gets the in-app browser allowlist from dynamic config.
 * This function wraps getDynamicConfigValue for easier testing.
 */
export function getInAppBrowserAllowlist(): DeepLinkUrlAllowlist {
  return getDynamicConfigValue({
    config: DynamicConfigs.DeepLinkUrlAllowlist,
    key: DeepLinkUrlAllowlistConfigKey.AllowedUrls,
    defaultValue: { allowedUrls: [] },
  })
}

/**
 * Gets the UwuLink allowlist from dynamic config.
 * This function wraps getDynamicConfigValue for easier testing.
 */
export function getUwuLinkAllowlist(): UwULinkAllowlist {
  return getDynamicConfigValue({
    config: DynamicConfigs.UwuLink,
    key: UwuLinkConfigKey.Allowlist,
    defaultValue: {
      contracts: [],
      tokenRecipients: [],
    },
    customTypeGuard: isUwULinkAllowlistType,
  })
}
