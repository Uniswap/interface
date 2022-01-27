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
  UNSUPPORTED = 'UNSUPPORTED',
  MISSING_ENROLLMENT = 'MISSING_ENROLLMENT',
  REJECTED = 'REJECTED',
  AUTHENTICATED = 'AUTHENTICATED',
}

export async function tryLocalAuthenticate(): Promise<BiometricAuthenticationStatus> {
  if (__DEV__ && !isEnabled(TestConfig.BIOMETRIC_PROMPT)) {
    return BiometricAuthenticationStatus.AUTHENTICATED
  }

  try {
    const compatible = await hasHardwareAsync()
    if (!compatible) {
      return BiometricAuthenticationStatus.UNSUPPORTED
    }

    const enrolled = await isEnrolledAsync()
    if (!enrolled) {
      return BiometricAuthenticationStatus.MISSING_ENROLLMENT
    }

    const result = await authenticateAsync()
    if (result.success === false) {
      return BiometricAuthenticationStatus.REJECTED
    }

    return BiometricAuthenticationStatus.AUTHENTICATED
  } catch (e) {
    logger.error('biometrics/index', 'tryLocalAuthenticate', `Failed to authenticate: ${e}`)

    return BiometricAuthenticationStatus.REJECTED
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
        .some((a) => a.type !== AccountType.readonly)
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
