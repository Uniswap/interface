import {
  authenticateAsync,
  hasHardwareAsync,
  isEnrolledAsync,
  LocalAuthenticationOptions,
} from 'expo-local-authentication'
import { logger } from 'utilities/src/logger/logger'

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
    logger.error(error, { tags: { file: 'biometrics/index', function: 'tryLocalAuthenticate' } })

    return BiometricAuthenticationStatus.Rejected
  }
}
