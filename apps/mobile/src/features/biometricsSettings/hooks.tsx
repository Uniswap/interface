import { hasHardwareAsync, isEnrolledAsync } from 'expo-local-authentication'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { triggerAuthentication } from 'src/features/biometrics/biometricsSlice'
import { isAndroid } from 'utilities/src/platform'

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
  failureCallback?: () => void,
): {
  trigger: (args?: TriggerArgs<T>) => Promise<void>
} {
  const dispatch = useDispatch()

  const trigger = useCallback(
    async (args?: TriggerArgs<T>): Promise<void> => {
      dispatch(
        triggerAuthentication({
          onSuccess: (params?: unknown) => {
            const typedParams = params as T | undefined
            if (args?.successCallback) {
              args.successCallback(typedParams)
            } else if (successCallback) {
              successCallback(typedParams)
            }
          },
          onFailure: args?.failureCallback ?? failureCallback,
          params: args?.params,
        }),
      )
    },
    [dispatch, successCallback, failureCallback],
  )

  return { trigger }
}

// TODO: remove
export const checkOsBiometricAuthEnabled = async (): Promise<boolean> => {
  const [compatible, enrolled] = await Promise.all([hasHardwareAsync(), isEnrolledAsync()])
  return compatible && enrolled
}

export function useBiometricName(isTouchIdSupported: boolean, shouldCapitalize?: boolean): string {
  if (isAndroid) {
    return shouldCapitalize ? 'Biometrics' : 'biometrics'
  }

  // iOS is always capitalized
  return isTouchIdSupported ? 'Touch ID' : 'Face ID'
}
