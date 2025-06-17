import { RootParamList } from 'src/app/navigation/types'
import { MobileNavScreen, MobileScreens } from 'uniswap/src/types/screens/mobile'

export enum AuthMethod {
  FaceId = 'FaceId',
  None = 'None',
  TouchId = 'TouchId',
  // alphabetize additional values.
}

export function getAuthMethod({
  isSettingEnabled,
  isTouchIdSupported,
  isFaceIdSupported,
}: {
  isSettingEnabled: boolean
  isTouchIdSupported: boolean
  isFaceIdSupported: boolean
}): AuthMethod {
  if (isSettingEnabled) {
    // both cannot be true since no iOS device supports both
    if (isFaceIdSupported) {
      return AuthMethod.FaceId
    }
    if (isTouchIdSupported) {
      return AuthMethod.TouchId
    }
  }

  return AuthMethod.None
}

export function getEventParams(
  screen: MobileNavScreen,
  params: RootParamList[MobileNavScreen],
): Record<string, unknown> | undefined {
  switch (screen) {
    case MobileScreens.SettingsWallet:
      return {
        address: (params as RootParamList[MobileScreens.SettingsWallet]).address,
      }
    case MobileScreens.SettingsWalletEdit:
      return {
        address: (params as RootParamList[MobileScreens.SettingsWalletEdit]).address,
      }
    default:
      return undefined
  }
}
