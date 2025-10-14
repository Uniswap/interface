import { UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BiometricUnlockStorage,
  BiometricUnlockStorageData,
} from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import { encryptPasswordWithBiometricData } from 'src/app/features/biometricUnlock/biometricAuthUtils'
import { biometricUnlockCredentialQuery } from 'src/app/features/biometricUnlock/biometricUnlockCredentialQuery'
import { startNavigatorCredentialRequest } from 'src/app/features/biometricUnlock/useNavigatorCredentialAbortSignal'
import { assertPublicKeyCredential } from 'src/app/features/biometricUnlock/utils/assertPublicKeyCredential'
import { isUserVerifyingPlatformAuthenticatorAvailable } from 'src/app/utils/device/builtInBiometricCapabilitiesQuery'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import {
  createEmptySecretPayload,
  generateNew256BitRandomBuffer,
  getEncryptionKeyFromBuffer,
} from 'wallet/src/features/wallet/Keyring/crypto'

export function useBiometricUnlockSetupMutation(options?: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (password: string) => {
      const { abortSignal } = startNavigatorCredentialRequest('New biometric setup request initiated')

      await assertIsUserVerifyingPlatformAuthenticatorAvailable()
      const biometricStorageData = await createCredentialAndEncryptPassword({
        password,
        abortSignal,
      })
      await BiometricUnlockStorage.set(biometricStorageData)
    },
    retry: false,
    onSettled: () => {
      queryClient.invalidateQueries(biometricUnlockCredentialQuery())
    },
    onSuccess: options?.onSuccess,
    onError: (error) => {
      logger.error(error, {
        tags: {
          file: 'useBiometricUnlockSetupMutation.ts',
          function: 'useBiometricUnlockSetupMutation',
        },
      })

      options?.onError?.(error)
    },
  })
}

async function createCredentialAndEncryptPassword({
  password,
  abortSignal,
}: {
  password: string
  abortSignal: AbortSignal
}): Promise<BiometricUnlockStorageData> {
  // Encrypt the password using the same approach we use in `Keyring`
  const secretPayload = await createEmptySecretPayload()
  const randomBuffer = generateNew256BitRandomBuffer()

  const encryptionKey = await getEncryptionKeyFromBuffer({
    buffer: randomBuffer,
    secretPayload,
  })

  const rawKey = await window.crypto.subtle.exportKey('raw', encryptionKey)

  const { credentialId } = await createCredential({
    encryptionKey: rawKey,
    abortSignal,
  })

  return await encryptPasswordWithBiometricData({
    password,
    encryptionKey,
    credentialId,
  })
}

async function assertIsUserVerifyingPlatformAuthenticatorAvailable(): Promise<void> {
  if (!(await isUserVerifyingPlatformAuthenticatorAvailable())) {
    // This should never happen, as we should check for this before asking the user to create a biometric unlock credential.
    throw new Error('Invalid call to setup biometric unlock when platform authenticator is not available')
  }
}

const CREDENTIAL_NAME = 'Uniswap Extension'

// These algorithms provide a good balance of security, performance, and compatibility across different platforms.
// The order matters - the authenticator will typically choose the first algorithm it supports from this list.
const CREDENTIAL_ALGORITHMS: PublicKeyCredentialParameters[] = [
  // ES256 (ECDSA with SHA-256) - Most widely supported algorithm, good balance of security and performance
  {
    type: 'public-key',
    alg: -7,
  },
  // RS256 (RSA with SHA-256) - Strong security but slower than ES256
  {
    type: 'public-key',
    alg: -257,
  },
  // EdDSA (Edwards-curve Digital Signature Algorithm) - Modern algorithm with good performance
  {
    type: 'public-key',
    alg: -8,
  },
]

async function createCredential({
  encryptionKey,
  abortSignal,
}: {
  encryptionKey: ArrayBuffer
  abortSignal: AbortSignal
}): Promise<{ credentialId: string }> {
  // Create WebAuthn credential with platform authenticator (Touch ID, Windows Hello, etc.) forced
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: generateNew256BitRandomBuffer(),
      rp: {
        name: CREDENTIAL_NAME,
        id: window.location.hostname,
      },
      user: {
        id: encryptionKey,
        name: CREDENTIAL_NAME,
        displayName: CREDENTIAL_NAME,
      },
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        userVerification: 'required',
      },
      // @ts-expect-error - `hints` is a new property, only available in Chrome 128+.
      // This forces the credential to use the built-in passkey instead of prompting the user where to save it.
      hints: ['client-device'],
      pubKeyCredParams: CREDENTIAL_ALGORITHMS,
      timeout: 15 * ONE_SECOND_MS,
    },
    signal: abortSignal,
  })

  const publicKeyCredential = assertPublicKeyCredential(credential)

  // Convert raw ID to a storable string format
  const credentialId = btoa(String.fromCharCode(...new Uint8Array(publicKeyCredential.rawId)))

  return { credentialId }
}
