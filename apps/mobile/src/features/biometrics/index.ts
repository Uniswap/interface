import {
  authenticateAsync,
  hasHardwareAsync,
  isEnrolledAsync,
  LocalAuthenticationOptions,
  LocalAuthenticationResult,
} from 'expo-local-authentication'
import { NativeModulesProxy } from 'expo-modules-core'
import { Platform } from 'react-native'
import { logger } from 'utilities/src/logger/logger'

const ELA = NativeModulesProxy.ExpoLocalAuthentication

/**
 * Biometric authentication statuses
 * Note. Sorted by authentication level
 */
export enum BiometricAuthenticationStatus {
  Unsupported = 'UNSUPPORTED',
  MissingEnrollment = 'MISSING_ENROLLMENT',
  Rejected = 'REJECTED',
  Authenticated = 'AUTHENTICATED',
  Canceled = 'CANCELED',
  Authenticating = 'AUTHENTICATING',
  Lockout = 'LOCKOUT',
  UserCancel = 'USER_CANCEL',
  SystemCancel = 'SYSTEM_CANCEL',
}

export async function enroll(): Promise<void> {
  ELA?.enrollForAuthentication()
}

const DEFAULT_AUTHENTICATE_OPTIONS = {
  promptMessage: 'Please authenticate',
  // Temporary disabled due to the android AppState forground -> background triggers of biometrics popup with pin fallback
  disableDeviceFallback: Platform.OS === 'android' ? true : false,
  cancelLabel: 'Cancel',
}

// TODO: [MOB-220] Move into a saga
export async function tryLocalAuthenticate(
  authenticateOptions?: LocalAuthenticationOptions
): Promise<BiometricAuthenticationStatus> {
  try {
    const compatible = await hasHardwareAsync()

    if (!compatible) {
      return BiometricAuthenticationStatus.Unsupported
    }

    /**
     * Important: ExpoLocalAuthentication.isEnrolledAsync() method nested in isEnrolledAsync() returns false when
                  when users excieds the amount of retries. Exactly the same when user has no biometric setup on the device
                  and thats why we have to call authenticateAsync to be able to distingush between different errors.
     */
    const enrolled = await isEnrolledAsync()
    const result = await authenticateAsync(authenticateOptions || DEFAULT_AUTHENTICATE_OPTIONS)

    if (isInLockout(result)) {
      return BiometricAuthenticationStatus.Lockout
    }

    if (isCanceledByUser(result)) {
      return BiometricAuthenticationStatus.UserCancel
    }

    if (isCanceledBySystem(result)) {
      return BiometricAuthenticationStatus.SystemCancel
    }

    if (!enrolled) {
      return BiometricAuthenticationStatus.MissingEnrollment
    }

    if (result.success === false) {
      return BiometricAuthenticationStatus.Rejected
    }

    return BiometricAuthenticationStatus.Authenticated
  } catch (error) {
    logger.error(error, { tags: { file: 'biometrics/index', function: 'tryLocalAuthenticate' } })

    return BiometricAuthenticationStatus.Rejected
  }
}

const isInLockout = (result: LocalAuthenticationResult): boolean =>
  result.success === false && result.error === 'lockout'

const isCanceledByUser = (result: LocalAuthenticationResult): boolean =>
  result.success === false && result.error === 'user_cancel'

const isCanceledBySystem = (result: LocalAuthenticationResult): boolean =>
  result.success === false && result.error === 'system_cancel'
