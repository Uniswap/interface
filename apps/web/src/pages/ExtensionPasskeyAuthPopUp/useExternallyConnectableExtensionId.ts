import { DynamicConfigs, ExternallyConnectableExtensionConfigKey, useDynamicConfigValue } from '@universe/gating'
import { TRUSTED_CHROME_EXTENSION_IDS } from 'utilities/src/environment/extensionId'

export function useExternallyConnectableExtensionId(): string {
  const extensionId = useDynamicConfigValue<
    DynamicConfigs.ExternallyConnectableExtension,
    ExternallyConnectableExtensionConfigKey.ExtensionId,
    string
  >({
    config: DynamicConfigs.ExternallyConnectableExtension,
    key: ExternallyConnectableExtensionConfigKey.ExtensionId,
    defaultValue: TRUSTED_CHROME_EXTENSION_IDS.prod,
  })

  return extensionId
}
