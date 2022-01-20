import remoteConfig from '@react-native-firebase/remote-config'
import { TestConfig, TestConfigValues } from 'src/features/remoteConfig/testConfigs'
import { printDebugLogs } from 'src/features/remoteConfig/utils'

/**
 * Returns true if config is enabled.
 * Note:
 *  - Source may be local or remote depending on fetch+activation status
 *  - Values are cached for 12 hours by Firebase
 */
export function isEnabled(config: TestConfig) {
  return remoteConfig().getValue(config).asString() === 'enabled'
}

/** Toggles a local config to the given value. */
export function toggleLocalConfig(
  config: TestConfig,
  enabled: boolean,
  configDefaults = TestConfigValues
) {
  initializeRemoteConfig({
    ...configDefaults,
    [config]: enabled ? 'enabled' : 'disabled',
  })
}

/** Initializes Firebase Remote Config with default values. */
export async function initializeRemoteConfig(configDefaults = TestConfigValues) {
  await remoteConfig().setDefaults(configDefaults)
  await remoteConfig().fetchAndActivate()

  printDebugLogs()
}
