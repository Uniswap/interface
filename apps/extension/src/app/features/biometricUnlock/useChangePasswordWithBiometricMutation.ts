import { UseMutationResult, useMutation } from '@tanstack/react-query'
import { BiometricUnlockStorage } from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import {
  authenticateWithBiometricCredential,
  encryptPasswordWithBiometricData,
} from 'src/app/features/biometricUnlock/biometricAuthUtils'
import { startNavigatorCredentialRequest } from 'src/app/features/biometricUnlock/useNavigatorCredentialAbortSignal'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export function useChangePasswordWithBiometricMutation(options?: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}): UseMutationResult<void, Error, string> {
  const changePasswordWithBiometric = useEvent(async (newPassword: string): Promise<void> => {
    const { abortSignal } = startNavigatorCredentialRequest('Password change with biometric re-encryption initiated')

    // Get the current biometric credential data
    const biometricUnlockCredential = await BiometricUnlockStorage.get()
    if (!biometricUnlockCredential) {
      throw new Error('No biometric unlock credential found')
    }

    // Authenticate with WebAuthn to get the encryption key
    const { encryptionKey } = await authenticateWithBiometricCredential({
      credentialId: biometricUnlockCredential.credentialId,
      abortSignal,
    })

    // Change the password in the keyring
    await Keyring.changePassword(newPassword)

    // Re-encrypt the new password with the same encryption key
    const newBiometricData = await encryptPasswordWithBiometricData({
      password: newPassword,
      encryptionKey,
      credentialId: biometricUnlockCredential.credentialId,
    })

    // Update the stored biometric data
    await BiometricUnlockStorage.set(newBiometricData)
  })

  return useMutation({
    mutationFn: changePasswordWithBiometric,
    retry: false,
    onSuccess: options?.onSuccess,
    onError: (error) => {
      logger.error(error, {
        tags: {
          file: 'useChangePasswordWithBiometricMutation.ts',
          function: 'changePasswordWithBiometric',
        },
      })
      options?.onError?.(error)
    },
  })
}
