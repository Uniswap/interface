import { DynamicConfigs, ExternallyConnectableExtensionConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { TRUSTED_CHROME_EXTENSION_IDS } from 'utilities/src/environment/extensionId'

export function useExternallyConnectableExtensionId(): string {
  const extensionId = useDynamicConfigValue<
    DynamicConfigs.ExternallyConnectableExtension,
    ExternallyConnectableExtensionConfigKey.ExtensionId,
    string
  >(
    DynamicConfigs.ExternallyConnectableExtension,
    ExternallyConnectableExtensionConfigKey.ExtensionId,
    TRUSTED_CHROME_EXTENSION_IDS.prod,
  )

  return extensionId
}
