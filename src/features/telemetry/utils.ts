import { AuthMethod } from 'src/features/telemetry/constants'

export function getAuthMethod(
  isSettingEnabled: boolean,
  isTouchIdSupported: boolean,
  isFaceIdSupported: boolean
) {
  if (!isSettingEnabled) return AuthMethod.None

  // both cannot be true since no iOS device supports both
  if (isFaceIdSupported) return AuthMethod.FaceId
  if (isTouchIdSupported) return AuthMethod.TouchId

  return AuthMethod.None
}
