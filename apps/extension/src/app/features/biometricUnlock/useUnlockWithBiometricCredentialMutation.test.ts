import { webcrypto } from 'node:crypto'
import { waitFor } from '@testing-library/react'
import { BiometricUnlockStorage } from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import { useUnlockWithBiometricCredentialMutation } from 'src/app/features/biometricUnlock/useUnlockWithBiometricCredentialMutation'
import { renderHookWithProviders } from 'src/test/render'
import { encodeForStorage, encrypt, generateNew256BitRandomBuffer } from 'wallet/src/features/wallet/Keyring/crypto'

jest.mock('src/app/features/biometricUnlock/BiometricUnlockStorage')

const mockUnlockWithPassword = jest.fn()
jest.mock('src/app/features/lockScreen/useUnlockWithPassword', () => ({
  useUnlockWithPassword: jest.fn(() => mockUnlockWithPassword),
}))

// Mock the Web Crypto API with Node.js built-in
Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
})

// Mock the WebAuthn API
const mockCredentialsGet = jest.fn()
Object.defineProperty(navigator, 'credentials', {
  writable: true,
  value: { get: mockCredentialsGet },
})

const mockBiometricUnlockStorage = BiometricUnlockStorage as jest.Mocked<typeof BiometricUnlockStorage>

// Mock AuthenticatorAssertionResponse
class MockAuthenticatorAssertionResponse {
  // eslint-disable-next-line max-params
  constructor(
    public userHandle: ArrayBuffer | null,
    public authenticatorData: ArrayBuffer = new ArrayBuffer(0),
    public signature: ArrayBuffer = new ArrayBuffer(0),
    public clientDataJSON: ArrayBuffer = new ArrayBuffer(0),
  ) {}
}

// Mock PublicKeyCredential
class MockPublicKeyCredential {
  constructor(public response: AuthenticatorAssertionResponse) {}
}

Object.defineProperty(global, 'AuthenticatorAssertionResponse', {
  writable: true,
  value: MockAuthenticatorAssertionResponse,
})

Object.defineProperty(global, 'PublicKeyCredential', {
  writable: true,
  value: MockPublicKeyCredential,
})

describe('useUnlockWithBiometricCredentialMutation', () => {
  const mockPassword = 'test-password-123'
  const mockCredentialId = btoa('test-credential-id') // Use valid base64 encoded string
  let mockEncryptionKey: CryptoKey
  let mockEncryptionKeyBuffer: ArrayBuffer
  let mockEncryptedPayload: {
    ciphertext: string
    iv: string
    salt: string
    name: string
    iterations: number
    hash: string
  }

  beforeEach(async () => {
    // Create a real AES key for encryption/decryption
    mockEncryptionKey = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ])

    // Export the key to use as userHandle
    mockEncryptionKeyBuffer = await globalThis.crypto.subtle.exportKey('raw', mockEncryptionKey)

    // Create real encrypted payload
    const iv = generateNew256BitRandomBuffer()
    const encryptedData = await encrypt({
      encryptionKey: mockEncryptionKey,
      plaintext: mockPassword,
      additionalData: mockCredentialId,
      iv,
    })

    mockEncryptedPayload = {
      ciphertext: encryptedData,
      iv: encodeForStorage(iv),
      salt: '11,22,33,44,55,66,77,88,99,00,11,22,33,44,55,66', // Mock salt as comma-separated string
      name: 'PBKDF2',
      iterations: 100000,
      hash: 'SHA-256',
    }

    // Setup default mocks
    mockBiometricUnlockStorage.get.mockResolvedValue({
      credentialId: mockCredentialId,
      transports: ['internal'],
      secretPayload: mockEncryptedPayload,
    })

    const mockAuthResponse = new MockAuthenticatorAssertionResponse(mockEncryptionKeyBuffer)
    const mockPublicKeyCredential = new MockPublicKeyCredential(mockAuthResponse)
    mockCredentialsGet.mockResolvedValue(mockPublicKeyCredential)

    // Reset and configure mockUnlockWithPassword
    mockUnlockWithPassword.mockReset()
    mockUnlockWithPassword.mockResolvedValue(undefined)
  })

  describe('successful unlock', () => {
    it('should successfully unlock with biometric credential', async () => {
      const { result } = renderHookWithProviders(() => useUnlockWithBiometricCredentialMutation())

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // 1. Should retrieve biometric unlock credential from storage
      expect(mockBiometricUnlockStorage.get).toHaveBeenCalledTimes(1)

      // 2. Should authenticate with WebAuthn using the stored credential
      const credentialIdBuffer = Uint8Array.from(atob(mockCredentialId), (c) => c.charCodeAt(0))
      expect(mockCredentialsGet).toHaveBeenCalledWith({
        publicKey: {
          challenge: expect.any(Uint8Array),
          allowCredentials: [
            {
              type: 'public-key',
              id: credentialIdBuffer,
              transports: ['internal'],
            },
          ],
          userVerification: 'required',
          timeout: 15000, // 15 seconds
        },
        signal: expect.any(AbortSignal),
      })

      // 3. Should call unlockWithPassword with the decrypted password
      expect(mockUnlockWithPassword).toHaveBeenCalledWith({ password: mockPassword })
    })
  })

  describe('error handling', () => {
    it('should throw error when no biometric unlock credential found', async () => {
      mockBiometricUnlockStorage.get.mockResolvedValue(null)

      const { result } = renderHookWithProviders(() => useUnlockWithBiometricCredentialMutation())

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('No biometric unlock credential found')
      expect(mockCredentialsGet).not.toHaveBeenCalled()
      expect(mockUnlockWithPassword).not.toHaveBeenCalled()
    })

    it('should throw error when biometric authentication fails', async () => {
      mockCredentialsGet.mockResolvedValue(null)

      const { result } = renderHookWithProviders(() => useUnlockWithBiometricCredentialMutation())

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('Failed to create credential')
      expect(mockUnlockWithPassword).not.toHaveBeenCalled()
    })

    it('should throw error when no user handle returned from authentication', async () => {
      const mockAuthResponse = new MockAuthenticatorAssertionResponse(null) // No userHandle
      const mockPublicKeyCredential = new MockPublicKeyCredential(mockAuthResponse)
      mockCredentialsGet.mockResolvedValue(mockPublicKeyCredential)

      const { result } = renderHookWithProviders(() => useUnlockWithBiometricCredentialMutation())

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('No user handle returned from biometric authentication')
      expect(mockUnlockWithPassword).not.toHaveBeenCalled()
    })

    it('should throw error when password decryption fails', async () => {
      // Use a different encryption key for decryption (will cause decryption to fail)
      const differentKey = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
        'encrypt',
        'decrypt',
      ])
      const differentKeyBuffer = await globalThis.crypto.subtle.exportKey('raw', differentKey)

      const mockAuthResponse = new MockAuthenticatorAssertionResponse(differentKeyBuffer)
      const mockPublicKeyCredential = new MockPublicKeyCredential(mockAuthResponse)
      mockCredentialsGet.mockResolvedValue(mockPublicKeyCredential)

      const { result } = renderHookWithProviders(() => useUnlockWithBiometricCredentialMutation())

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('Failed to decrypt password')
      expect(mockUnlockWithPassword).not.toHaveBeenCalled()
    })

    it('should handle WebAuthn API errors', async () => {
      const webAuthnError = new Error('WebAuthn API error')
      mockCredentialsGet.mockRejectedValue(webAuthnError)

      const { result } = renderHookWithProviders(() => useUnlockWithBiometricCredentialMutation())

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(webAuthnError)
      expect(mockUnlockWithPassword).not.toHaveBeenCalled()
    })

    it('should handle storage retrieval errors', async () => {
      const storageError = new Error('Storage retrieval failed')
      mockBiometricUnlockStorage.get.mockRejectedValue(storageError)

      const { result } = renderHookWithProviders(() => useUnlockWithBiometricCredentialMutation())

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(storageError)
      expect(mockCredentialsGet).not.toHaveBeenCalled()
      expect(mockUnlockWithPassword).not.toHaveBeenCalled()
    })
  })

  describe('mutation configuration', () => {
    it('should not retry on failure', async () => {
      mockBiometricUnlockStorage.get.mockResolvedValue(null)

      const { result } = renderHookWithProviders(() => useUnlockWithBiometricCredentialMutation())

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Should only be called once (no retries)
      expect(mockBiometricUnlockStorage.get).toHaveBeenCalledTimes(1)
    })
  })
})
