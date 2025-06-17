import {
  authenticateAsync,
  hasHardwareAsync,
  isEnrolledAsync,
  LocalAuthenticationResult,
} from 'expo-local-authentication'
import DeviceInfo from 'react-native-device-info'
import { openSecuritySettings } from 'src/utils/linking'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import { isAndroid } from 'utilities/src/platform'

/**
 * Biometric authentication statuses
 * Note. Sorted by authentication level
 */
export enum BiometricAuthenticationStatus {
  Unsupported = 'UNSUPPORTED',
  MissingEnrollment = 'MISSING_ENROLLMENT',
  Rejected = 'REJECTED',
  Authenticated = 'AUTHENTICATED',
  Authenticating = 'AUTHENTICATING',
  Lockout = 'LOCKOUT',
  UserCancel = 'USER_CANCEL',
  SystemCancel = 'SYSTEM_CANCEL',
  Invalid = 'INVALID',
}

export async function enroll(): Promise<void> {
  await openSecuritySettings()
}

// TODO: [MOB-220] Move into a saga
export async function tryLocalAuthenticate(): Promise<BiometricAuthenticationStatus> {
  try {
    const compatible = await hasHardwareAsync()

    if (!compatible) {
      return BiometricAuthenticationStatus.Unsupported
    }

    /**
     * Important: ExpoLocalAuthentication.isEnrolledAsync() method nested in isEnrolledAsync() returns false when
                  when users exceeds the amount of retries. Exactly the same when user has no biometric setup on the device
                  and thats why we have to call authenticateAsync to be able to distinguish between different errors.
     */
    const enrolled = await isEnrolledAsync()
    const disableDeviceFallback = isAndroid && (await DeviceInfo.getApiLevel()) < 30

    const result = await authenticateAsync({
      cancelLabel: i18n.t('common.button.cancel'),
      promptMessage: i18n.t('settings.setting.biometrics.auth'),
      requireConfirmation: false,
      biometricsSecurityLevel: 'strong',
      disableDeviceFallback,
    })

    if (result.success === true) {
      return BiometricAuthenticationStatus.Authenticated
    }

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

    return BiometricAuthenticationStatus.Rejected
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
