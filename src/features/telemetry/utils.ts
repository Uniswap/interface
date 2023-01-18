import { RootParamList } from 'src/app/navigation/types'
import { AuthMethod } from 'src/features/telemetry/constants'
import { AppScreen, Screens } from 'src/screens/Screens'
import { currencyIdToAddress } from 'src/utils/currencyId'

export function getAuthMethod(
  isSettingEnabled: boolean,
  isTouchIdSupported: boolean,
  isFaceIdSupported: boolean
): AuthMethod {
  if (!isSettingEnabled) return AuthMethod.None

  // both cannot be true since no iOS device supports both
  if (isFaceIdSupported) return AuthMethod.FaceId
  if (isTouchIdSupported) return AuthMethod.TouchId

  return AuthMethod.None
}

export function getImpressionEventParams(
  screen: AppScreen,
  params: RootParamList[AppScreen]
): Record<string, unknown> | undefined {
  switch (screen) {
    case Screens.TokenDetails:
      return {
        address: currencyIdToAddress((params as RootParamList[Screens.TokenDetails]).currencyId),
      }
    case Screens.ExternalProfile:
      return { address: (params as RootParamList[Screens.ExternalProfile]).address }
    case Screens.NFTItem:
      return {
        address: (params as RootParamList[Screens.NFTItem]).address,
        item_id: (params as RootParamList[Screens.NFTItem]).tokenId,
      }
    case Screens.SettingsWallet:
      return {
        address: (params as RootParamList[Screens.SettingsWallet]).address,
      }
    case Screens.SettingsWalletEdit:
      return {
        address: (params as RootParamList[Screens.SettingsWalletEdit]).address,
      }
    default:
      return undefined
  }
}
