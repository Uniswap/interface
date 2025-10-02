import { UseMutationResult, useMutation } from '@tanstack/react-query'
import {
  BiometricUnlockStorage,
  BiometricUnlockStorageData,
} from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import { startNavigatorCredentialRequest } from 'src/app/features/biometricUnlock/useNavigatorCredentialAbortSignal'
import { assertAuthenticatorAssertionResponse } from 'src/app/features/biometricUnlock/utils/assertAuthenticatorAssertionResponse'
import { assertPublicKeyCredential } from 'src/app/features/biometricUnlock/utils/assertPublicKeyCredential'
import { useUnlockWithPassword } from 'src/app/features/lockScreen/useUnlockWithPassword'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import {
  convertBytesToCryptoKey,
  decodeFromStorage,
  decrypt,
  generateNew256BitRandomBuffer,
} from 'wallet/src/features/wallet/Keyring/crypto'
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
  } catch (_error) {
    return { password: null }
  }
}

async function getPasswordFromBiometricCredential(abortSignal: AbortSignal): Promise<string> {
  const biometricUnlockCredential = await BiometricUnlockStorage.get()

  if (!biometricUnlockCredential) {
    throw new Error('No biometric unlock credential found')
  }

  const { credentialId } = biometricUnlockCredential

  // Authenticate with WebAuthn using the stored credential and decrypt password
  const publicKeyCredential = await authenticateWithCredential({ credentialId, abortSignal })
  const password = await decryptPasswordFromCredential({ publicKeyCredential, biometricUnlockCredential })
  return password
}

async function authenticateWithCredential({
  credentialId,
  abortSignal,
}: {
  credentialId: string
  abortSignal: AbortSignal
}): Promise<PublicKeyCredential> {
  // Convert stored credential ID back to binary format
  const credentialIdBuffer = Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0))

  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: generateNew256BitRandomBuffer(),
      allowCredentials: [
        {
          type: 'public-key',
          id: credentialIdBuffer,
        },
      ],
      userVerification: 'required',
      timeout: 15 * ONE_SECOND_MS,
    },
    signal: abortSignal,
  })

  const publicKeyCredential = assertPublicKeyCredential(credential)

  return publicKeyCredential
}

async function getCryptoKeyFromCredential({
  publicKeyCredential,
}: {
  publicKeyCredential: PublicKeyCredential
}): Promise<CryptoKey> {
  const response = publicKeyCredential.response
  assertAuthenticatorAssertionResponse(response)

  if (!response.userHandle) {
    throw new Error('No user handle returned from biometric authentication')
  }

  // The user handle contains our encryption key (stored during credential creation)
  const encryptionKeyBuffer = new Uint8Array(response.userHandle)

  // Create a `CryptoKey` from the encryption key
  const cryptoKey = await convertBytesToCryptoKey(encryptionKeyBuffer)

  return cryptoKey
}

async function decryptPasswordFromCredential({
  publicKeyCredential,
  biometricUnlockCredential,
}: {
  publicKeyCredential: PublicKeyCredential
  biometricUnlockCredential: BiometricUnlockStorageData
}): Promise<string> {
  const encryptionKey = await getCryptoKeyFromCredential({ publicKeyCredential })

  // Decrypt the password
  const decryptedPassword = await decrypt({
    encryptionKey,
    ciphertext: decodeFromStorage(biometricUnlockCredential.secretPayload.ciphertext),
    iv: decodeFromStorage(biometricUnlockCredential.secretPayload.iv),
    additionalData: biometricUnlockCredential.credentialId, // Use credential ID as additional authenticated data
  })

  if (!decryptedPassword) {
    throw new Error('Failed to decrypt password')
  }

  return decryptedPassword
}
