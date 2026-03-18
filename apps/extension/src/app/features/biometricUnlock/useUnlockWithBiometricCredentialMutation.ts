import { UseMutationResult, useMutation } from '@tanstack/react-query'
import { BiometricUnlockStorage } from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import {
  authenticateWithBiometricCredential,
  decryptPasswordFromBiometricData,
} from 'src/app/features/biometricUnlock/biometricAuthUtils'
import { startNavigatorCredentialRequest } from 'src/app/features/biometricUnlock/useNavigatorCredentialAbortSignal'
import { useUnlockWithPassword } from 'src/app/features/lockScreen/useUnlockWithPassword'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export function useUnlockWithBiometricCredentialMutation(): UseMutationResult<void, Error, void> {
  const unlockWithPassword = useUnlockWithPassword()

  const unlockWithBiometric = useEvent(async (): Promise<void> => {
    const { abortSignal } = startNavigatorCredentialRequest('New biometric unlock request initiated')
    const password = await getPasswordFromBiometricCredential(abortSignal)
    unlockWithPassword({ password })
  })

  return useMutation({
    mutationFn: unlockWithBiometric,
    retry: false,
    onError: (error) => {
      logger.error(error, {
        tags: {
          file: 'useUnlockWithBiometricCredentialMutation.ts',
          function: 'unlockWithBiometric',
        },
      })
    },
  })
}

/**
 * Reauthenticates a user with their biometric credential.
 * Meant to be used when the Extension is already unlocked but we want to prompt the user to re-authenticate.
 * For example, when viewing the seed phrase or changing their password.
 *
 * @returns the user's password if authentication is successful, null otherwise.
 */
export async function reauthenticateWithBiometricCredential(): Promise<{ password: string | null }> {
  try {
    const { abortSignal } = startNavigatorCredentialRequest('New biometric reauthentication request initiated')
    const password = await getPasswordFromBiometricCredential(abortSignal)
    const success = await Keyring.checkPassword(password)
    return { password: success ? password : null }
  } catch {
    return { password: null }
  }
}

async function getPasswordFromBiometricCredential(abortSignal: AbortSignal): Promise<string> {
  const biometricUnlockCredential = await BiometricUnlockStorage.get()

  if (!biometricUnlockCredential) {
    throw new Error('No biometric unlock credential found')
  }

  const { credentialId, transports } = biometricUnlockCredential

  // Authenticate with WebAuthn using the stored credential and decrypt password
  const { encryptionKey } = await authenticateWithBiometricCredential({ credentialId, transports, abortSignal })
  const password = await decryptPasswordFromBiometricData({ encryptionKey, biometricUnlockCredential })
  return password
}
