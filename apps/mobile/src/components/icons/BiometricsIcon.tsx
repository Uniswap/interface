import { useDeviceSupportsBiometricAuth } from 'src/features/biometrics/hooks'
import { Faceid, Fingerprint } from 'ui/src/components/icons'

export function BiometricsIcon(): JSX.Element | null {
  const { touchId: isTouchIdSupported, faceId: isFaceIdSupported } =
    useDeviceSupportsBiometricAuth()

  if (isTouchIdSupported) {
    return <Fingerprint color="white" size="$icon.20" />
  }

  if (isFaceIdSupported) {
    return <Faceid color="white" size="$icon.20" />
  }

  return null
}
