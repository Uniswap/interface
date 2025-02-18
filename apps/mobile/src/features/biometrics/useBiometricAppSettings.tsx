import { useSelector } from 'react-redux'
import { BiometricSettingsState, selectBiometricSettings } from 'src/features/biometricsSettings/slice'

export function useBiometricAppSettings(): BiometricSettingsState {
  return useSelector(selectBiometricSettings)
}
