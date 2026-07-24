import { webcrypto } from 'node:crypto'
import { waitFor } from '@testing-library/react'
import { BiometricUnlockStorage } from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import { useBiometricUnlockSetupMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockSetupMutation'
import { isUserVerifyingPlatformAuthenticatorAvailable } from 'src/app/utils/device/builtInBiometricCapabilitiesQuery'
import { renderHookWithProviders } from 'src/test/render'
import type { Mock, Mocked, MockedFunction } from 'vitest'
import {
  createEmptySecretPayload,
  decodeFromStorage,
  decrypt,
  getEncryptionKeyFromBuffer,
} from 'wallet/src/features/wallet/Keyring/crypto'

vi.mock('src/app/features/biometricUnlock/BiometricUnlockStorage')
vi.mock('src/app/utils/device/builtInBiometricCapabilitiesQuery')
vi.mock('wallet/src/features/wallet/Keyring/crypto', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wallet/src/features/wallet/Keyring/crypto')>()),
  createEmptySecretPayload: vi.fn(),
  getEncryptionKeyFromBuffer: vi.fn(),
}))

// Mock the Web Crypto API with Node.js built-in
Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
})

// Mock the WebAuthn API
const mockCredentialsCreate = vi.fn()
Object.defineProperty(navigator, 'credentials', {
  writable: true,
  value: { create: mockCredentialsCreate },
})

const mockBiometricUnlockStorage = BiometricUnlockStorage as Mocked<typeof BiometricUnlockStorage>
const mockIsUserVerifyingPlatformAuthenticatorAvailable =
  isUserVerifyingPlatformAuthenticatorAvailable as MockedFunction<typeof isUserVerifyingPlatformAuthenticatorAvailable>

// Mock crypto functions (the module is mocked above, so the static imports are the mocks)
const mockCreateEmptySecretPayload = createEmptySecretPayload as Mock
const mockGetEncryptionKeyFromBuffer = getEncryptionKeyFromBuffer as Mock

// Mock PublicKeyCredential (doesn't exist in Jest environment)
class MockPublicKeyCredential {
  constructor(
    public rawId: ArrayBuffer,
    public response = {
      getTransports: () => ['internal' as AuthenticatorTransport],
    },
  ) {}
}
Object.defineProperty(global, 'PublicKeyCredential', {
  writable: true,
  value: MockPublicKeyCredential,
})

describe('useBiometricUnlockSetupMutation', () => {
  const mockPassword = 'test-password-123'
  const mockPublicKeyCredential = new MockPublicKeyCredential(new ArrayBuffer(16))

  let mockEncryptionKey: CryptoKey
  let mockSecretPayload: any

  beforeEach(async () => {
    // Create a real AES key that can be used with real crypto.subtle.exportKey
    mockEncryptionKey = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ])

    mockSecretPayload = {
      iv: '12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12', // Mock IV as comma-separated string (ArrayBuffer.toString() format)
      salt: '11,22,33,44,55,66,77,88,99,00,11,22,33,44,55,66', // Mock salt as comma-separated string
      name: 'PBKDF2',
      iterations: 100000,
      hash: 'SHA-256',
    }

    // Setup happy path defaults
    mockIsUserVerifyingPlatformAuthenticatorAvailable.mockResolvedValue(true)
    mockCreateEmptySecretPayload.mockResolvedValue(mockSecretPayload)
    mockGetEncryptionKeyFromBuffer.mockResolvedValue(mockEncryptionKey)
    mockCredentialsCreate.mockResolvedValue(mockPublicKeyCredential)
    mockBiometricUnlockStorage.set.mockResolvedValue()

    vi.clearAllMocks()
  })

  describe('successful setup', () => {
    it('should successfully set up biometric unlock', async () => {
      const { result } = renderHookWithProviders(() => useBiometricUnlockSetupMutation())

      result.current.mutate(mockPassword)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const expectedCredentialId = btoa(String.fromCharCode(...new Uint8Array(mockPublicKeyCredential.rawId)))
      const expectedRawKey = await globalThis.crypto.subtle.exportKey('raw', mockEncryptionKey)

      // Should check if platform authenticator is available
      expect(mockIsUserVerifyingPlatformAuthenticatorAvailable).toHaveBeenCalledTimes(1)

      // Should create WebAuthn credential with proper security configuration
      expect(mockCredentialsCreate).toHaveBeenCalledWith({
        publicKey: expect.objectContaining({
          rp: { name: 'Uniswap Extension', id: window.location.hostname },
          user: expect.objectContaining({
            id: expectedRawKey, // Encryption key used as user ID
            name: 'Uniswap Extension',
            displayName: 'Uniswap Extension',
          }),
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Must use built-in authenticator
            residentKey: 'required', // Credential stored on device
            userVerification: 'required', // Biometric verification required
          },
          hints: ['client-device'],
          pubKeyCredParams: expect.arrayContaining([
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
            { type: 'public-key', alg: -8 },
          ]),
        }),
        signal: expect.any(AbortSignal),
      })

      // Verify the stored secret payload has all required properties
      const storedData = mockBiometricUnlockStorage.set.mock.calls[0]![0] as {
        credentialId: string
        transports: AuthenticatorTransport[]
        secretPayload: typeof mockSecretPayload
      }

      expect(storedData.credentialId).toBe(expectedCredentialId)
      expect(storedData.transports).toEqual(['internal'])

      expect(storedData.secretPayload).toEqual(
        expect.objectContaining({
          iv: mockSecretPayload.iv,
          salt: mockSecretPayload.salt,
          name: mockSecretPayload.name,
          iterations: mockSecretPayload.iterations,
          hash: mockSecretPayload.hash,
          ciphertext: expect.any(String),
        }),
      )

      // Verify the encrypted password can be decrypted back to the original
      const decryptedPassword = await decrypt({
        encryptionKey: mockEncryptionKey,
        ciphertext: decodeFromStorage(storedData.secretPayload.ciphertext),
        iv: decodeFromStorage(storedData.secretPayload.iv),
        additionalData: storedData.credentialId, // Same credential ID used for encryption
      })

      expect(decryptedPassword).toBe(mockPassword) // Should decrypt back to original password
    })
  })

  describe('error handling', () => {
    it('should throw error when platform authenticator is not available', async () => {
      mockIsUserVerifyingPlatformAuthenticatorAvailable.mockResolvedValue(false)

      const { result } = renderHookWithProviders(() => useBiometricUnlockSetupMutation())

      result.current.mutate(mockPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe(
        'Invalid call to setup biometric unlock when platform authenticator is not available',
      )
    })

    it('should handle credential creation failure', async () => {
      mockCredentialsCreate.mockResolvedValue(null)

      const { result } = renderHookWithProviders(() => useBiometricUnlockSetupMutation())

      result.current.mutate(mockPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('Failed to create credential')
    })

    it('should handle non-PublicKeyCredential response', async () => {
      mockCredentialsCreate.mockResolvedValue({} as Credential)

      const { result } = renderHookWithProviders(() => useBiometricUnlockSetupMutation())

      result.current.mutate(mockPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('Created credential is not a `PublicKeyCredential`')
    })

    it('should handle crypto operations errors', async () => {
      const cryptoError = new Error('Crypto operation failed')
      mockCreateEmptySecretPayload.mockRejectedValue(cryptoError)

      const { result } = renderHookWithProviders(() => useBiometricUnlockSetupMutation())

      result.current.mutate(mockPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(cryptoError)
    })

    it('should handle storage errors', async () => {
      const storageError = new Error('Storage failed')
      mockBiometricUnlockStorage.set.mockRejectedValue(storageError)

      const { result } = renderHookWithProviders(() => useBiometricUnlockSetupMutation())

      result.current.mutate(mockPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(storageError)
    })
  })

  describe('mutation configuration', () => {
    it('should not retry on failure', async () => {
      mockIsUserVerifyingPlatformAuthenticatorAvailable.mockResolvedValue(false)

      const { result } = renderHookWithProviders(() => useBiometricUnlockSetupMutation())

      result.current.mutate(mockPassword)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Should only be called once (no retries)
      expect(mockIsUserVerifyingPlatformAuthenticatorAvailable).toHaveBeenCalledTimes(1)
    })
  })
})
