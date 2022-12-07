import DeviceInfo from 'react-native-device-info'
import { UpgradeStatus } from 'src/features/forceUpgrade/types'

/**
 * This could be used to deal with manually overriden flags, server flags, and default value flags.
 */
type Flag = {
  name: string
  defaultValue: unknown
}

/**
 * Adding a new flag:
 *
 * 1. Add the flag to the FLAGS object below. The key should be the name of the flag.
 * 2. The value must be the default value of the flag. This will be used in case the flag is not found in the remote config.
 *
 * This was the best way I could think of to have us do: Flags.flag.name instead of having to type the actual string
 * name of the flag. This way we don't have to worry about typos.
 */
export const flags: { [key: string]: Flag } = {
  force_upgrade: {
    name: 'force_upgrade',
    defaultValue: {
      status: UpgradeStatus.NotRequired,
      minVersion: DeviceInfo.getVersion(),
    },
  },
}
