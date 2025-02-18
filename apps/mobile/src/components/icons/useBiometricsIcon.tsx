import { useDeviceSupportsBiometricAuth } from 'src/features/biometrics/useDeviceSupportsBiometricAuth'
import { Faceid, Fingerprint } from 'ui/src/components/icons'

export type BiometricsIconProps = {
  color?: string
}

export function useBiometricsIcon(): (({ color }: BiometricsIconProps) => JSX.Element) | null {
  const { touchId: isTouchIdSupported, faceId: isFaceIdSupported } = useDeviceSupportsBiometricAuth()

  if (isTouchIdSupported) {
    return function renderFingerprint({ color }: BiometricsIconProps): JSX.Element {
      return <Fingerprint color={color} size="$icon.20" />
    }
  }

  if (isFaceIdSupported) {
    return function renderFaceId({ color }: BiometricsIconProps): JSX.Element {
      return <Faceid color={color} size="$icon.20" />
    }
  }

  return null
}
