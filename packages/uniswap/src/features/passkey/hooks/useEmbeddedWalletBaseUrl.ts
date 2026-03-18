import { DynamicConfigs, EmbeddedWalletConfigKey, useDynamicConfigValue } from '@universe/gating'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'

export function useEmbeddedWalletBaseUrl(): string {
  const baseUrl = useDynamicConfigValue({
    config: DynamicConfigs.EmbeddedWalletConfig,
    key: EmbeddedWalletConfigKey.BaseUrl,
    defaultValue: UNISWAP_WEB_URL,
  })

  return baseUrl
}
