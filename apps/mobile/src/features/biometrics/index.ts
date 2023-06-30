import {
  authenticateAsync,
  hasHardwareAsync,
  isEnrolledAsync,
  LocalAuthenticationOptions,
} from 'expo-local-authentication'
import { logger } from 'wallet/src/features/logger/logger'
import serializeError from 'wallet/src/utils/serializeError'

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

    const result = await authenticateAsync(authenticateOptions)
    if (result.success === false) {
      return BiometricAuthenticationStatus.Rejected
    }

    return BiometricAuthenticationStatus.Authenticated
  } catch (error) {
    logger.error('Failed biometrics authentication', {
      tags: {
        file: 'biometrics/index',
        function: 'tryLocalAuthenticate',
        error: serializeError(error),
      },
    })

    return BiometricAuthenticationStatus.Rejected
  }
}
