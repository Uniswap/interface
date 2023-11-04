import { useDeviceSupportsBiometricAuth } from 'src/features/biometrics/hooks'
import { Icons } from 'ui/src'

export function BiometricsIcon(): JSX.Element | null {
  const { touchId: isTouchIdSupported, faceId: isFaceIdSupported } =
    useDeviceSupportsBiometricAuth()

  if (isTouchIdSupported) {
    return <Icons.Fingerprint color="white" size="$icon.20" />
  }

  if (isFaceIdSupported) {
    return <Icons.Faceid color="white" size="$icon.20" />
  }

  return null
}
