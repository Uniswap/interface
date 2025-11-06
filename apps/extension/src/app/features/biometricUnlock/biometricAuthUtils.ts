import { BiometricUnlockStorageData } from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import { assertAuthenticatorAssertionResponse } from 'src/app/features/biometricUnlock/utils/assertAuthenticatorAssertionResponse'
import { assertPublicKeyCredential } from 'src/app/features/biometricUnlock/utils/assertPublicKeyCredential'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import {
  addEncryptedCiphertextToSecretPayload,
  convertBytesToCryptoKey,
  createEmptySecretPayload,
  decodeFromStorage,
  decrypt,
  generateNew256BitRandomBuffer,
} from 'wallet/src/features/wallet/Keyring/crypto'

/**
 * Authenticates with a biometric credential and returns both the credential and encryption key
 */
export async function authenticateWithBiometricCredential({
  credentialId,
  transports,
  abortSignal,
}: {
  credentialId: string
  transports: AuthenticatorTransport[]
  abortSignal: AbortSignal
}): Promise<{ publicKeyCredential: PublicKeyCredential; encryptionKey: CryptoKey }> {
  // Convert stored credential ID back to binary format
  const credentialIdBuffer = Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0))

  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: generateNew256BitRandomBuffer(),
      allowCredentials: [
        {
          type: 'public-key',
          id: credentialIdBuffer,
          transports,
        },
      ],
      userVerification: 'required',
      timeout: 15 * ONE_SECOND_MS,
    },
    signal: abortSignal,
  })

  const publicKeyCredential = assertPublicKeyCredential(credential)
  const encryptionKey = await extractEncryptionKeyFromCredential(publicKeyCredential)

  return { publicKeyCredential, encryptionKey }
}

/**
 * Extracts the encryption key from a WebAuthn credential response
 */
async function extractEncryptionKeyFromCredential(publicKeyCredential: PublicKeyCredential): Promise<CryptoKey> {
  const response = publicKeyCredential.response
  assertAuthenticatorAssertionResponse(response)

  if (!response.userHandle) {
    throw new Error('No user handle returned from biometric authentication')
  }

  // The user handle contains our encryption key (stored during credential creation)
  const encryptionKeyBuffer = new Uint8Array(response.userHandle)
  const cryptoKey = await convertBytesToCryptoKey(encryptionKeyBuffer)

  return cryptoKey
}

/**
 * Encrypts a password with biometric data using the provided encryption key
 */
export async function encryptPasswordWithBiometricData({
  password,
  encryptionKey,
  credentialId,
  transports,
}: {
  password: string
  encryptionKey: CryptoKey
  credentialId: string
  transports: AuthenticatorTransport[]
}): Promise<BiometricUnlockStorageData> {
  // Create a new secret payload for the password
  const secretPayload = await createEmptySecretPayload()

  // Encrypt the password with the encryption key
  const secretPayloadWithCiphertext = await addEncryptedCiphertextToSecretPayload({
    secretPayload,
    plaintext: password,
    encryptionKey,
    additionalData: credentialId, // Use credential ID as additional authenticated data
  })

  return { credentialId, transports, secretPayload: secretPayloadWithCiphertext }
}

/**
 * Decrypts a password from biometric credential data
 */
export async function decryptPasswordFromBiometricData({
  encryptionKey,
  biometricUnlockCredential,
}: {
  encryptionKey: CryptoKey
  biometricUnlockCredential: BiometricUnlockStorageData
}): Promise<string> {
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
