import {
  authenticateAsync,
  hasHardwareAsync,
  isEnrolledAsync,
  LocalAuthenticationOptions,
} from 'expo-local-authentication'
import { NativeModulesProxy } from 'expo-modules-core'
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
}

export async function enroll(): Promise<void> {
  ELA?.enrollForAuthentication()
}

const DEFAULT_AUTHENTICATE_OPTIONS = {
  promptMessage: 'Please authenticate',
  disableDeviceFallback: true,
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

    const enrolled = await isEnrolledAsync()
    if (!enrolled) {
      return BiometricAuthenticationStatus.MissingEnrollment
    }

    const result = await authenticateAsync(authenticateOptions || DEFAULT_AUTHENTICATE_OPTIONS)
    if (result.success === false) {
      return BiometricAuthenticationStatus.Rejected
    }

    return BiometricAuthenticationStatus.Authenticated
  } catch (error) {
    logger.error(error, { tags: { file: 'biometrics/index', function: 'tryLocalAuthenticate' } })

    return BiometricAuthenticationStatus.Rejected
  }
}
