import { DdSdkReactNative } from '@datadog/mobile-react-native'
import { MobileUserPropertyName } from 'uniswap/src/features/telemetry/user'
import { getUniqueId } from 'utilities/src/device/getUniqueId'

export async function setDatadogUserWithUniqueId(activeAddress: Maybe<Address>): Promise<string> {
  const uniqueId = await getUniqueId()
  DdSdkReactNative.setUser({
    id: uniqueId,
    ...(activeAddress ? { [MobileUserPropertyName.ActiveWalletAddress]: activeAddress } : {}),
  }).catch(() => undefined)
  return uniqueId
}
