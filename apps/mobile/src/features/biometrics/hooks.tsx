import {
  AuthenticationType,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
} from 'expo-local-authentication'
import { useAppSelector } from 'src/app/hooks'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics'
import { useBiometricContext } from 'src/features/biometrics/context'
import { BiometricSettingsState } from 'src/features/biometrics/slice'
import { isAndroid } from 'uniswap/src/utils/platform'
import { useAsyncData } from 'utilities/src/react/hooks'

type TriggerArgs<T> = {
  params?: T
  successCallback?: (params?: T) => void
  failureCallback?: () => void
}

/**
 * Hook shortcut to use the biometric prompt.
 *
 * It can be used by either declaring the success/failure callbacks at the time you call the hook,
 * or by declaring them when you call the trigger function:
 *
 * Example 1:
 *
 * ```ts
 * const { trigger } = useBiometricPrompt(() => { success() }, () => { failure() })
 * triger({
 *   params: { ... },
 * })
 * ```
 *
 * Example 2:
 *
 * ```ts
 * const { trigger } = useBiometricPrompt()
 * triger({
 *  successCallback: () => { success() },
 *  failureCallback: () => { success() },
 *  params: { ... },
 * })
 * ```
 *
 * TODO(MOB-2523): standardize usage of this hook and remove the style of Example 1.
 *
 * @returns trigger Trigger the OS biometric flow and invokes successCallback on success.
 */
export function useBiometricPrompt<T = undefined>(
  successCallback?: (params?: T) => void,
  failureCallback?: () => void
): {
  trigger: (args?: TriggerArgs<T>) => Promise<void>
} {
  const { setAuthenticationStatus } = useBiometricContext()

  const trigger = async (args?: TriggerArgs<T>): Promise<void> => {
    setAuthenticationStatus(BiometricAuthenticationStatus.Authenticating)
    const authStatus = await tryLocalAuthenticate()

    setAuthenticationStatus(authStatus)

    const _successCallback = args?.successCallback ?? successCallback
    const _failureCallback = args?.failureCallback ?? failureCallback

    if (
      biometricAuthenticationSuccessful(authStatus) ||
      biometricAuthenticationDisabledByOS(authStatus)
    ) {
      _successCallback?.(args?.params)
    } else {
      _failureCallback?.()
    }
  }

  return { trigger }
}

export function biometricAuthenticationSuccessful(status: BiometricAuthenticationStatus): boolean {
  return status === BiometricAuthenticationStatus.Authenticated
}

export function biometricAuthenticationRejected(status: BiometricAuthenticationStatus): boolean {
  return status === BiometricAuthenticationStatus.Rejected
}

export function biometricAuthenticationDisabledByOS(
  status: BiometricAuthenticationStatus
): boolean {
  return (
    status === BiometricAuthenticationStatus.Unsupported ||
    status === BiometricAuthenticationStatus.MissingEnrollment
  )
}

/**
 * Check function of biometric device support
 * @returns object representing biometric auth support by type
 */
export function useDeviceSupportsBiometricAuth(): { touchId: boolean; faceId: boolean } {
  // check if device supports biometric authentication
  const authenticationTypes = useAsyncData(supportedAuthenticationTypesAsync).data
  return {
    touchId: authenticationTypes?.includes(AuthenticationType.FINGERPRINT) ?? false,
    faceId: authenticationTypes?.includes(AuthenticationType.FACIAL_RECOGNITION) ?? false,
  }
}

export const checkOsBiometricAuthEnabled = async (): Promise<boolean> => {
  const [compatible, enrolled] = await Promise.all([hasHardwareAsync(), isEnrolledAsync()])
  return compatible && enrolled
}

/**
 * Hook to determine whether biometric auth is enabled in OS settings
 * @returns if Face ID or Touch ID is enabled
 */
export function useOsBiometricAuthEnabled(): boolean | undefined {
  return useAsyncData(checkOsBiometricAuthEnabled).data
}

export function useBiometricAppSettings(): BiometricSettingsState {
  const biometricSettings = useAppSelector((state) => state.biometricSettings)
  return biometricSettings
}

export function useBiometricName(isTouchIdSupported: boolean, shouldCapitalize?: boolean): string {
  if (isAndroid) {
    return shouldCapitalize ? 'Biometrics' : 'biometrics'
  }

  // iOS is always capitalized
  return isTouchIdSupported ? 'Touch ID' : 'Face ID'
}
