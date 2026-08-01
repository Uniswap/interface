import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import {
  deleteAuthenticator,
  listAuthenticators,
  registerNewAuthenticator,
  startAddAuthenticatorSession,
} from 'uniswap/src/features/passkey/authenticatorManagement'
import {
  clearDeviceSession,
  generateDeviceKeyPair,
  getDeviceSession,
  setDeviceSession,
  storeNeckMetadata,
  storeNeckSigningKey,
} from 'uniswap/src/features/passkey/deviceSession'
import { authenticatePasskey, registerPasskey } from 'uniswap/src/features/passkey/passkey'
import { type MockedFunction, vi } from 'vitest'

vi.mock('uniswap/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchListAuthenticatorsRequest: vi.fn(),
    fetchChallengeRequest: vi.fn(),
    fetchStartAuthenticatedSessionRequest: vi.fn(),
    fetchPrepareAddAuthenticatorRequest: vi.fn(),
    fetchAddAuthenticatorRequest: vi.fn(),
    fetchDeleteAuthenticatorRequest: vi.fn(),
  },
}))

vi.mock('@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb', () => ({
  Action: {
    REGISTER_NEW_AUTHENTICATION_TYPES: 5,
    DELETE_RECOVERY: 6,
  },
  AuthenticationTypes: {
    PASSKEY_AUTHENTICATION: 1,
    PASSKEY_REGISTRATION: 2,
  },
}))

vi.mock('uniswap/src/features/passkey/passkeySession', () => ({
  authenticateWithPasskey: vi.fn(),
  refreshNeckSession: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/deviceSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/passkey/deviceSession')>()
  return {
    ...actual,
    loadNeckMetadata: vi.fn().mockReturnValue(null),
    loadNeckSigningKey: vi.fn().mockResolvedValue('mock-private-key'),
    storeNeckMetadata: vi.fn(),
    storeNeckSigningKey: vi.fn().mockResolvedValue(undefined),
    generateDeviceKeyPair: vi.fn().mockResolvedValue({
      privateKey: 'mock-private-key',
      publicKeyBase64: 'mock-public-key',
    }),
    signWithDeviceKey: vi.fn().mockResolvedValue('mock-device-signature'),
  }
})

vi.mock('uniswap/src/features/passkey/passkey', () => ({
  authenticatePasskey: vi.fn(),
  registerPasskey: vi.fn(),
}))

const MOCK_ACTION = {
  REGISTER_NEW_AUTHENTICATION_TYPES: 5,
} as const

const MOCK_AUTH_TYPES = {
  PASSKEY_AUTHENTICATION: 1,
  PASSKEY_REGISTRATION: 2,
} as const

const mockAuthenticatePasskey = authenticatePasskey as MockedFunction<typeof authenticatePasskey>
const mockRegisterPasskey = registerPasskey as MockedFunction<typeof registerPasskey>

const mockFetchChallengeRequest = EmbeddedWalletApiClient.fetchChallengeRequest as MockedFunction<
  typeof EmbeddedWalletApiClient.fetchChallengeRequest
>
const mockFetchStartAuthenticatedSessionRequest =
  EmbeddedWalletApiClient.fetchStartAuthenticatedSessionRequest as MockedFunction<
    typeof EmbeddedWalletApiClient.fetchStartAuthenticatedSessionRequest
  >
const mockFetchListAuthenticatorsRequest = EmbeddedWalletApiClient.fetchListAuthenticatorsRequest as MockedFunction<
  typeof EmbeddedWalletApiClient.fetchListAuthenticatorsRequest
>
const mockFetchPrepareAddAuthenticatorRequest =
  EmbeddedWalletApiClient.fetchPrepareAddAuthenticatorRequest as MockedFunction<
    typeof EmbeddedWalletApiClient.fetchPrepareAddAuthenticatorRequest
  >
const mockFetchAddAuthenticatorRequest = EmbeddedWalletApiClient.fetchAddAuthenticatorRequest as MockedFunction<
  typeof EmbeddedWalletApiClient.fetchAddAuthenticatorRequest
>
const mockFetchDeleteAuthenticatorRequest = EmbeddedWalletApiClient.fetchDeleteAuthenticatorRequest as MockedFunction<
  typeof EmbeddedWalletApiClient.fetchDeleteAuthenticatorRequest
>

describe('authenticatorManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearDeviceSession()
  })

  afterEach(() => {
    clearDeviceSession()
  })

  describe('listAuthenticators', () => {
    it('returns authenticators from the API', async () => {
      const mockAuthenticators = [{ credentialId: 'cred-1' }, { credentialId: 'cred-2' }]
      mockFetchChallengeRequest.mockResolvedValue({
        signingPayload: 'mock-signing-payload',
        sessionActive: true,
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
      mockFetchListAuthenticatorsRequest.mockResolvedValue({
        authenticators: mockAuthenticators,
        recoveryMethods: [],
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchListAuthenticatorsRequest>>)

      const result = await listAuthenticators('wallet-1')

      expect(result.authenticators).toEqual(mockAuthenticators)
      expect(result.recoveryMethods).toEqual([])
      expect(result.lastExportedMs).toBeUndefined()
      expect(mockFetchListAuthenticatorsRequest).toHaveBeenCalledWith({
        deviceAuth: expect.objectContaining({ walletId: 'wallet-1' }),
      })
    })

    it('passes through lastExported as milliseconds when present', async () => {
      mockFetchChallengeRequest.mockResolvedValue({
        signingPayload: 'mock-signing-payload',
        sessionActive: true,
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
      mockFetchListAuthenticatorsRequest.mockResolvedValue({
        authenticators: [],
        recoveryMethods: [],
        lastExported: BigInt(1_717_000_000_000),
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchListAuthenticatorsRequest>>)

      const result = await listAuthenticators('wallet-1')

      expect(result.lastExportedMs).toBe(1_717_000_000_000)
    })
  })

  describe('startAddAuthenticatorSession', () => {
    it('sets the ephemeral device session without persisting NECK on success', async () => {
      mockFetchChallengeRequest.mockResolvedValue({
        challengeOptions: 'challenge-json',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)

      mockAuthenticatePasskey.mockResolvedValue('existing-credential-123')

      mockFetchStartAuthenticatedSessionRequest.mockResolvedValue({
        policyId: 'policy-abc',
        policyExpiresAt: BigInt(Date.now() + 60_000),
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchStartAuthenticatedSessionRequest>>)

      const result = await startAddAuthenticatorSession('wallet-1')

      expect(result).toBe('existing-credential-123')
      expect(mockAuthenticatePasskey).toHaveBeenCalledWith('challenge-json')
      expect(storeNeckSigningKey).not.toHaveBeenCalled()
      expect(storeNeckMetadata).not.toHaveBeenCalled()
      expect(getDeviceSession()).not.toBeNull()
      expect(getDeviceSession()?.policyId).toBe('policy-abc')
    })

    it('throws when no challenge options', async () => {
      mockFetchChallengeRequest.mockResolvedValue({
        challengeOptions: undefined,
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)

      await expect(startAddAuthenticatorSession()).rejects.toThrow('No challenge options returned')
    })
  })

  describe('registerNewAuthenticator', () => {
    it('throws if no active device session', async () => {
      await expect(
        registerNewAuthenticator({
          authenticatorAttachment: 0 as unknown as Parameters<
            typeof registerNewAuthenticator
          >[0]['authenticatorAttachment'],
        }),
      ).rejects.toThrow('No active device session')
    })

    it('signs the server-prepared payload and submits the device signature', async () => {
      const { privateKey } = await generateDeviceKeyPair()
      setDeviceSession({
        privateKey,
        policyId: 'policy-1',
        policyExpiresAt: Date.now() + 60_000,
        walletId: 'wallet-1',
      })

      mockFetchChallengeRequest.mockResolvedValue({
        challengeOptions: 'reg-challenge-json',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)

      const mockCredentialResponse = JSON.stringify({
        response: { publicKey: 'dGVzdC1wdWJsaWMta2V5' },
      })
      mockRegisterPasskey.mockResolvedValue(mockCredentialResponse)
      mockFetchPrepareAddAuthenticatorRequest.mockResolvedValue({
        signingPayload: 'server-prepared-payload',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchPrepareAddAuthenticatorRequest>>)
      mockFetchAddAuthenticatorRequest.mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchAddAuthenticatorRequest>>,
      )

      await registerNewAuthenticator({
        authenticatorAttachment: 0 as unknown as Parameters<
          typeof registerNewAuthenticator
        >[0]['authenticatorAttachment'],
        username: 'testuser',
        walletId: 'wallet-1',
      })

      expect(mockRegisterPasskey).toHaveBeenCalledWith('reg-challenge-json')
      expect(mockFetchPrepareAddAuthenticatorRequest).toHaveBeenCalledWith({
        newCredential: mockCredentialResponse,
      })
      expect(mockFetchAddAuthenticatorRequest).toHaveBeenCalledWith({
        newCredential: mockCredentialResponse,
        deviceSignature: 'mock-device-signature',
      })
    })

    it('throws if PrepareAddAuthenticator returns no signing payload', async () => {
      const { privateKey } = await generateDeviceKeyPair()
      setDeviceSession({
        privateKey,
        policyId: 'policy-1',
        policyExpiresAt: Date.now() + 60_000,
        walletId: 'wallet-1',
      })

      mockFetchChallengeRequest.mockResolvedValue({
        challengeOptions: 'reg-challenge-json',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
      mockRegisterPasskey.mockResolvedValue(JSON.stringify({ response: { publicKey: 'dGVzdC1wdWJsaWMta2V5' } }))
      mockFetchPrepareAddAuthenticatorRequest.mockResolvedValue({
        signingPayload: '',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchPrepareAddAuthenticatorRequest>>)

      await expect(
        registerNewAuthenticator({
          authenticatorAttachment: 0 as unknown as Parameters<
            typeof registerNewAuthenticator
          >[0]['authenticatorAttachment'],
          walletId: 'wallet-1',
        }),
      ).rejects.toThrow('PrepareAddAuthenticator returned no signing payload')
      expect(mockFetchAddAuthenticatorRequest).not.toHaveBeenCalled()
    })
  })

  describe('deleteAuthenticator', () => {
    it('returns false when no credential provided', async () => {
      const result = await deleteAuthenticator({
        authenticator: { credentialId: 'cred-1' } as unknown as Parameters<
          typeof deleteAuthenticator
        >[0]['authenticator'],
      })

      expect(result).toBe(false)
      expect(mockFetchDeleteAuthenticatorRequest).not.toHaveBeenCalled()
    })

    it('returns true on successful deletion', async () => {
      mockFetchDeleteAuthenticatorRequest.mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchDeleteAuthenticatorRequest>>,
      )

      const result = await deleteAuthenticator({
        authenticator: { credentialId: 'cred-1' } as unknown as Parameters<
          typeof deleteAuthenticator
        >[0]['authenticator'],
        credential: 'auth-credential',
      })

      expect(result).toBe(true)
      expect(mockFetchDeleteAuthenticatorRequest).toHaveBeenCalledWith({
        credential: 'auth-credential',
        authenticatorId: 'cred-1',
      })
    })
  })
})
