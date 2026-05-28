import { DdSdkReactNative } from '@datadog/mobile-react-native'
import { getUniqueIdSync } from 'react-native-device-info'
import { MobileUserPropertyName } from 'uniswap/src/features/telemetry/user'

export function setDatadogUserWithUniqueId(activeAddress: Maybe<Address>): void {
  DdSdkReactNative.setUser({
    id: getUniqueIdSync(),
    ...(activeAddress ? { [MobileUserPropertyName.ActiveWalletAddress]: activeAddress } : {}),
  }).catch(() => undefined)
}
