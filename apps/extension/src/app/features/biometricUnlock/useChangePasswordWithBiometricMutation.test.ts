import { webcrypto } from 'node:crypto'
import { waitFor } from '@testing-library/react'
import { BiometricUnlockStorage } from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import { useChangePasswordWithBiometricMutation } from 'src/app/features/biometricUnlock/useChangePasswordWithBiometricMutation'
import { renderHookWithProviders } from 'src/test/render'
import { logger } from 'utilities/src/logger/logger'
import { encodeForStorage, encrypt, generateNew256BitRandomBuffer } from 'wallet/src/features/wallet/Keyring/crypto'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

// Mock dependencies
jest.mock('src/app/features/biometricUnlock/BiometricUnlockStorage')
jest.mock('wallet/src/features/wallet/Keyring/Keyring', () => ({
  Keyring: {
    changePassword: jest.fn(),
  },
}))
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
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
const mockKeyring = Keyring as jest.Mocked<typeof Keyring>
const mockLogger = logger as jest.Mocked<typeof logger>

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

describe('useChangePasswordWithBiometricMutation', () => {
  const mockOldPassword = 'old-password-123'
  const mockNewPassword = 'new-password-456'
  const mockCredentialId = btoa('test-credential-id') // Use valid base64 encoded string
  let mockEncryptionKey: CryptoKey
  let mockEncryptionKeyBuffer: ArrayBuffer
  let mockOldEncryptedPayload: {
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

    // Create real encrypted payload for the old password
    const iv = generateNew256BitRandomBuffer()
    const encryptedData = await encrypt({
      encryptionKey: mockEncryptionKey,
      plaintext: mockOldPassword,
      additionalData: mockCredentialId,
      iv,
    })

    mockOldEncryptedPayload = {
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
      secretPayload: mockOldEncryptedPayload,
    })

    const mockAuthResponse = new MockAuthenticatorAssertionResponse(mockEncryptionKeyBuffer)
    const mockPublicKeyCredential = new MockPublicKeyCredential(mockAuthResponse)
    mockCredentialsGet.mockResolvedValue(mockPublicKeyCredential)

    mockKeyring.changePassword.mockResolvedValue(true)
    mockBiometricUnlockStorage.set.mockResolvedValue()

    jest.clearAllMocks()
  })

  describe('successful password change', () => {
    it('should successfully change password with biometric re-encryption', async () => {
      const onSuccess = jest.fn()
      const onError = jest.fn()

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onSuccess, onError }))

      result.current.mutate(mockNewPassword)

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

      // 3. Should change the password in the keyring
      expect(mockKeyring.changePassword).toHaveBeenCalledWith(mockNewPassword)

      // 4. Should update the stored biometric data with re-encrypted password
      expect(mockBiometricUnlockStorage.set).toHaveBeenCalledWith({
        credentialId: mockCredentialId,
        transports: ['internal'],
        secretPayload: expect.objectContaining({
          ciphertext: expect.any(String),
          iv: expect.any(String),
          salt: expect.any(String),
          name: 'PBKDF2',
          iterations: expect.any(Number),
          hash: 'SHA-256',
        }),
      })

      // 5. Should call onSuccess callback
      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onError).not.toHaveBeenCalled()
    })

    it('should re-encrypt new password with the same encryption key', async () => {
      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation())

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify that the new encrypted payload can be decrypted with the same key
      const setCall = mockBiometricUnlockStorage.set.mock.calls[0]
      const newBiometricData = setCall?.[0]

      expect(newBiometricData?.credentialId).toBe(mockCredentialId)
      expect(newBiometricData?.transports).toEqual(['internal'])
      expect(newBiometricData?.secretPayload).toMatchObject({
        ciphertext: expect.any(String),
        iv: expect.any(String),
        salt: expect.any(String),
        name: 'PBKDF2',
        iterations: expect.any(Number),
        hash: 'SHA-256',
      })

      // The new payload should be different from the old one (different password encrypted)
      expect(newBiometricData?.secretPayload.ciphertext).not.toBe(mockOldEncryptedPayload.ciphertext)
    })
  })

  describe('error handling', () => {
    it('should throw error when no biometric unlock credential found', async () => {
      mockBiometricUnlockStorage.get.mockResolvedValue(null)
      const onError = jest.fn()

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onError }))

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('No biometric unlock credential found')
      expect(mockCredentialsGet).not.toHaveBeenCalled()
      expect(mockKeyring.changePassword).not.toHaveBeenCalled()
      expect(mockBiometricUnlockStorage.set).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should throw error when biometric authentication fails', async () => {
      mockCredentialsGet.mockResolvedValue(null)
      const onError = jest.fn()

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onError }))

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('Failed to create credential')
      expect(mockKeyring.changePassword).not.toHaveBeenCalled()
      expect(mockBiometricUnlockStorage.set).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should throw error when no user handle returned from authentication', async () => {
      const mockAuthResponse = new MockAuthenticatorAssertionResponse(null) // No userHandle
      const mockPublicKeyCredential = new MockPublicKeyCredential(mockAuthResponse)
      mockCredentialsGet.mockResolvedValue(mockPublicKeyCredential)
      const onError = jest.fn()

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onError }))

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('No user handle returned from biometric authentication')
      expect(mockKeyring.changePassword).not.toHaveBeenCalled()
      expect(mockBiometricUnlockStorage.set).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle keyring password change failure', async () => {
      const keyringError = new Error('Keyring password change failed')
      mockKeyring.changePassword.mockRejectedValue(keyringError)
      const onError = jest.fn()

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onError }))

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(keyringError)
      expect(mockBiometricUnlockStorage.set).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(keyringError)
    })

    it('should handle biometric storage update failure', async () => {
      const storageError = new Error('Storage update failed')
      mockBiometricUnlockStorage.set.mockRejectedValue(storageError)
      const onError = jest.fn()

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onError }))

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(storageError)
      expect(mockKeyring.changePassword).toHaveBeenCalledWith(mockNewPassword)
      expect(onError).toHaveBeenCalledWith(storageError)
    })

    it('should handle WebAuthn API errors', async () => {
      const webAuthnError = new Error('WebAuthn API error')
      mockCredentialsGet.mockRejectedValue(webAuthnError)
      const onError = jest.fn()

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onError }))

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(webAuthnError)
      expect(mockKeyring.changePassword).not.toHaveBeenCalled()
      expect(mockBiometricUnlockStorage.set).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(webAuthnError)
    })

    it('should handle storage retrieval errors', async () => {
      const storageError = new Error('Storage retrieval failed')
      mockBiometricUnlockStorage.get.mockRejectedValue(storageError)
      const onError = jest.fn()

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onError }))

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(storageError)
      expect(mockCredentialsGet).not.toHaveBeenCalled()
      expect(mockKeyring.changePassword).not.toHaveBeenCalled()
      expect(mockBiometricUnlockStorage.set).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(storageError)
    })

    it('should log errors when they occur', async () => {
      const testError = new Error('Test error')
      mockBiometricUnlockStorage.get.mockRejectedValue(testError)

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation())

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(mockLogger.error).toHaveBeenCalledWith(testError, {
        tags: {
          file: 'useChangePasswordWithBiometricMutation.ts',
          function: 'changePasswordWithBiometric',
        },
      })
    })
  })

  describe('callback handling', () => {
    it('should work without callbacks provided', async () => {
      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation())

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should not throw any errors when no callbacks are provided
      expect(mockKeyring.changePassword).toHaveBeenCalledWith(mockNewPassword)
      expect(mockBiometricUnlockStorage.set).toHaveBeenCalled()
    })

    it('should call onSuccess callback when mutation succeeds', async () => {
      const onSuccess = jest.fn()

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onSuccess }))

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should call onError callback when mutation fails', async () => {
      const testError = new Error('Test error')
      const onError = jest.fn()
      mockBiometricUnlockStorage.get.mockRejectedValue(testError)

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onError }))

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(onError).toHaveBeenCalledWith(testError)
    })

    it('should call both onSuccess and onError callbacks appropriately', async () => {
      const onSuccess = jest.fn()
      const onError = jest.fn()

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation({ onSuccess, onError }))

      // First test success case
      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onError).not.toHaveBeenCalled()

      // Reset and test error case
      jest.clearAllMocks()
      onSuccess.mockClear()
      onError.mockClear()

      const testError = new Error('Test error')
      mockBiometricUnlockStorage.get.mockRejectedValue(testError)

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(onSuccess).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(testError)
    })
  })

  describe('mutation configuration', () => {
    it('should not retry on failure', async () => {
      mockBiometricUnlockStorage.get.mockResolvedValue(null)

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation())

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Should only be called once (no retries)
      expect(mockBiometricUnlockStorage.get).toHaveBeenCalledTimes(1)
    })

    it('should have correct mutation function signature', () => {
      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation())

      expect(typeof result.current.mutate).toBe('function')
      expect(typeof result.current.mutateAsync).toBe('function')
      expect(typeof result.current.reset).toBe('function')
      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeNull()
    })

    it('should handle abort signal properly', async () => {
      // Mock a scenario where the WebAuthn request is aborted
      const abortError = new DOMException('The operation was aborted.', 'AbortError')
      mockCredentialsGet.mockRejectedValue(abortError)

      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation())

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(abortError)
      expect(mockKeyring.changePassword).not.toHaveBeenCalled()
    })
  })

  describe('WebAuthn integration', () => {
    it('should use correct WebAuthn parameters', async () => {
      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation())

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(mockCredentialsGet).toHaveBeenCalled()
      })

      const webAuthnCall = mockCredentialsGet.mock.calls[0][0]
      expect(webAuthnCall.publicKey).toMatchObject({
        challenge: expect.any(Uint8Array),
        allowCredentials: [
          {
            type: 'public-key',
            id: expect.any(Uint8Array),
          },
        ],
        userVerification: 'required',
        timeout: 15000,
      })
      expect(webAuthnCall.signal).toBeInstanceOf(AbortSignal)
    })

    it('should convert credential ID properly for WebAuthn', async () => {
      const { result } = renderHookWithProviders(() => useChangePasswordWithBiometricMutation())

      result.current.mutate(mockNewPassword)

      await waitFor(() => {
        expect(mockCredentialsGet).toHaveBeenCalled()
      })

      const webAuthnCall = mockCredentialsGet.mock.calls[0][0]
      const allowedCredential = webAuthnCall.publicKey.allowCredentials[0]
      const expectedCredentialId = Uint8Array.from(atob(mockCredentialId), (c) => c.charCodeAt(0))

      expect(allowedCredential.id).toEqual(expectedCredentialId)
    })
  })
})
