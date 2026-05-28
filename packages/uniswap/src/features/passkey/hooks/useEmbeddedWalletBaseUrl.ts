import { DynamicConfigs, EmbeddedWalletConfigKey, getDynamicConfigValue, useDynamicConfigValue } from '@universe/gating'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'

export function useEmbeddedWalletBaseUrl(): string {
  const baseUrl = useDynamicConfigValue({
    config: DynamicConfigs.EmbeddedWalletConfig,
    key: EmbeddedWalletConfigKey.BaseUrl,
    defaultValue: UNISWAP_WEB_URL,
  })

  return baseUrl
}

// Sync non-hook equivalent for transport and other non-React callers. Reads the current
// Statsig snapshot each call; falls back to UNISWAP_WEB_URL if Statsig has not initialized.
export function getEmbeddedWalletBaseUrl(): string {
  return getDynamicConfigValue({
    config: DynamicConfigs.EmbeddedWalletConfig,
    key: EmbeddedWalletConfigKey.BaseUrl,
    defaultValue: UNISWAP_WEB_URL,
  })
}
