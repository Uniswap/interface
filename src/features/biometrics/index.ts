import { authenticateAsync, hasHardwareAsync, isEnrolledAsync } from 'expo-local-authentication'
import { useCallback, useEffect } from 'react'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { AccountType } from 'src/features/wallet/accounts/types'
import { DEMO_ACCOUNT_ADDRESS } from 'src/features/wallet/accounts/useTestAccount'
import { useAccounts } from 'src/features/wallet/hooks'
import { logger } from 'src/utils/logger'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'

/**
 * Biometric authentication statuses
 * Note. Sorted by authenticatino level
 */
export enum BiometricAuthenticationStatus {
  Unsupported = 'UNSUPPORTED',
  MissingEnrollment = 'MISSING_ENROLLMENT',
  Rejected = 'REJECTED',
  Authenticated = 'AUTHENTICATED',
}

export async function tryLocalAuthenticate(): Promise<BiometricAuthenticationStatus> {
  if (__DEV__ && !isEnabled(TestConfig.BiometricPrompt)) {
    return BiometricAuthenticationStatus.Authenticated
  }

  try {
    const compatible = await hasHardwareAsync()
    if (!compatible) {
      return BiometricAuthenticationStatus.Unsupported
    }

    const enrolled = await isEnrolledAsync()
    if (!enrolled) {
      return BiometricAuthenticationStatus.MissingEnrollment
    }

    const result = await authenticateAsync()
    if (result.success === false) {
      return BiometricAuthenticationStatus.Rejected
    }

    return BiometricAuthenticationStatus.Authenticated
  } catch (e) {
    logger.error('biometrics/index', 'tryLocalAuthenticate', `Failed to authenticate: ${e}`)

    return BiometricAuthenticationStatus.Rejected
  }
}

export function BiometricCheck() {
  const { trigger, modal } = useBiometricPrompt()
  const accounts = useAccounts()

  const biometricTrigger = useCallback(() => {
    // only show prompt if there are no imported accounts
    if (
      Object.values(accounts)
        // TODO: remove in v0.3
        .filter((a) => a.address !== DEMO_ACCOUNT_ADDRESS)
        .some((a) => a.type !== AccountType.Readonly)
    ) {
      trigger()
    }
  }, [trigger, accounts])

  // on mount
  useEffect(() => {
    biometricTrigger()
  }, [biometricTrigger])

  useAppStateTrigger('background', 'active', biometricTrigger)

  return modal
}
