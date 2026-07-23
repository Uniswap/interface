import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import {
  exportEncryptedSeedPhrase,
  sign7702AuthorizationWithPasskey,
  sign7702TransactionWithPasskey,
  signMessageWithPasskey,
  signTransactionWithPasskey,
  signTypedDataWithPasskey,
} from 'uniswap/src/features/passkey/signing'
import { type MockedFunction, vi } from 'vitest'

vi.mock('uniswap/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchChallengeRequest: vi.fn(),
    fetchSignMessagesRequest: vi.fn(),
    fetchSignTransactionsRequest: vi.fn(),
    fetchSignTypedDataRequest: vi.fn(),
    fetchExportSeedPhraseRequest: vi.fn(),
    fetchExportEncryptedSeedPhraseRequest: vi.fn(),
    fetchSign7702AuthorizationRequest: vi.fn(),
    fetchSign7702TransactionRequest: vi.fn(),
  },
}))

const mockRefreshNeckSession = vi.fn()
vi.mock('uniswap/src/features/passkey/passkeySession', () => ({
  refreshNeckSession: (...args: unknown[]) => mockRefreshNeckSession(...args),
}))

const mockAuthenticatePasskey = vi.fn()
vi.mock('uniswap/src/features/passkey/passkey', () => ({
  authenticatePasskey: (...args: unknown[]) => mockAuthenticatePasskey(...args),
}))

const mockLoadNeckMetadata = vi.fn()
const mockSignWithDeviceKey = vi.fn()
const mockEnsureNeckKeyPair = vi.fn()
vi.mock('uniswap/src/features/passkey/deviceSession', () => ({
  loadNeckMetadata: (...args: unknown[]) => mockLoadNeckMetadata(...args),
  signWithDeviceKey: (...args: unknown[]) => mockSignWithDeviceKey(...args),
  ensureNeckKeyPair: (...args: unknown[]) => mockEnsureNeckKeyPair(...args),
}))

vi.mock('@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb', () => ({
  Action: {
    SIGN_MESSAGE: 1,
    SIGN_TRANSACTION: 2,
    SIGN_TYPED_DATA: 3,
    EXPORT_SEED_PHRASE: 4,
    SIGN_7702_AUTHORIZATION: 14,
    SIGN_7702_TRANSACTION: 15,
  },
  AuthenticationTypes: {
    PASSKEY_AUTHENTICATION: 1,
  },
}))

vi.mock('@universe/api', () => ({
  SharedQueryClient: { setQueryData: vi.fn() },
}))

const MOCK_ACTION = {
  SIGN_MESSAGE: 1,
  SIGN_TRANSACTION: 2,
  SIGN_TYPED_DATA: 3,
  EXPORT_SEED_PHRASE: 4,
} as const

const MOCK_AUTH_TYPES = {
  PASSKEY_AUTHENTICATION: 1,
} as const

const mockFetchChallengeRequest = EmbeddedWalletApiClient.fetchChallengeRequest as MockedFunction<
  typeof EmbeddedWalletApiClient.fetchChallengeRequest
>
const mockFetchSignMessagesRequest = EmbeddedWalletApiClient.fetchSignMessagesRequest as MockedFunction<
  typeof EmbeddedWalletApiClient.fetchSignMessagesRequest
>
const mockFetchSignTransactionsRequest = EmbeddedWalletApiClient.fetchSignTransactionsRequest as MockedFunction<
  typeof EmbeddedWalletApiClient.fetchSignTransactionsRequest
>
const mockFetchSignTypedDataRequest = EmbeddedWalletApiClient.fetchSignTypedDataRequest as MockedFunction<
  typeof EmbeddedWalletApiClient.fetchSignTypedDataRequest
>
const mockFetchExportEncryptedSeedPhraseRequest =
  EmbeddedWalletApiClient.fetchExportEncryptedSeedPhraseRequest as MockedFunction<
    typeof EmbeddedWalletApiClient.fetchExportEncryptedSeedPhraseRequest
  >
const mockFetchSign7702Auth = EmbeddedWalletApiClient.fetchSign7702AuthorizationRequest as MockedFunction<
  typeof EmbeddedWalletApiClient.fetchSign7702AuthorizationRequest
>
const mockFetchSign7702Tx = EmbeddedWalletApiClient.fetchSign7702TransactionRequest as MockedFunction<
  typeof EmbeddedWalletApiClient.fetchSign7702TransactionRequest
>

/**
 * Sets up mocks for the signWithDeviceSessionOrPasskey flow with active session.
 */
function setupDeviceSessionMocks(walletId = 'wallet-1'): void {
  mockLoadNeckMetadata.mockReturnValue({
    publicKeyBase64: 'mock-device-public-key',
    walletId,
    deviceKeyQuorumId: 'quorum-1',
  })
  mockEnsureNeckKeyPair.mockResolvedValue({
    privateKey: 'mock-private-key',
    publicKeyBase64: 'mock-device-public-key',
    isFresh: false,
  })
  mockFetchChallengeRequest.mockResolvedValue({
    signingPayload: 'mock-signing-payload',
    sessionActive: true,
  } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
  mockSignWithDeviceKey.mockResolvedValue('mock-device-signature')
}

/**
 * Sets up mocks for the signWithDeviceSessionOrPasskey flow when no session exists.
 * ensureNeckKeyPair absorbs the generate + persist steps and returns the fresh pair.
 */
function setupNoSessionMocks(): void {
  mockLoadNeckMetadata.mockReturnValue(null)
  // isFresh: true simulates a fresh regeneration — the caller should trigger a
  // refreshNeckSession upfront to bind the new pub key server-side.
  mockEnsureNeckKeyPair.mockResolvedValue({
    privateKey: 'mock-generated-private-key',
    publicKeyBase64: 'mock-generated-public-key',
    isFresh: true,
  })
  mockFetchChallengeRequest.mockResolvedValue({
    signingPayload: 'mock-signing-payload',
    sessionActive: true,
  } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
  mockRefreshNeckSession.mockResolvedValue(undefined)
  mockSignWithDeviceKey.mockResolvedValue('mock-device-signature')
}

describe('signing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signWithDeviceSessionOrPasskey (active session)', () => {
    it('uses NECK device auth when session is active', async () => {
      setupDeviceSessionMocks()
      mockFetchSignMessagesRequest.mockResolvedValue({
        signatures: ['0xsig123'],
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchSignMessagesRequest>>)

      const result = await signMessageWithPasskey('hello')

      expect(result).toBe('0xsig123')
      expect(mockFetchChallengeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MOCK_AUTH_TYPES.PASSKEY_AUTHENTICATION,
          action: MOCK_ACTION.SIGN_MESSAGE,
          walletId: 'wallet-1',
          devicePublicKey: 'mock-device-public-key',
          message: 'hello',
        }),
      )
      expect(mockFetchSignMessagesRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: ['hello'],
          auth: {
            case: 'deviceAuth',
            value: {
              deviceSignature: 'mock-device-signature',
              walletId: 'wallet-1',
              signingPayload: 'mock-signing-payload',
            },
          },
        }),
      )
      expect(mockRefreshNeckSession).not.toHaveBeenCalled()
    })
  })

  describe('signWithDeviceSessionOrPasskey (no session, refreshes NECK)', () => {
    it('generates keypair and refreshes NECK when no metadata exists', async () => {
      setupNoSessionMocks()
      mockFetchSignMessagesRequest.mockResolvedValue({
        signatures: ['0xsig-after-refresh'],
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchSignMessagesRequest>>)

      const result = await signMessageWithPasskey('hello', 'wallet-1')

      expect(result).toBe('0xsig-after-refresh')
      expect(mockEnsureNeckKeyPair).toHaveBeenCalledWith('wallet-1')
      // isFresh: true triggers an upfront refresh to bind the new pub key server-side
      expect(mockRefreshNeckSession).toHaveBeenCalledWith('mock-generated-public-key', 'wallet-1')
      // After upfront refresh, a single Challenge suffices — server returns sessionActive: true
      expect(mockFetchChallengeRequest).toHaveBeenCalledTimes(1)
      expect(mockFetchChallengeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          devicePublicKey: 'mock-generated-public-key',
        }),
      )
    })

    it('throws when challenge has no signingPayload', async () => {
      mockLoadNeckMetadata.mockReturnValue({
        publicKeyBase64: 'mock-key',
        walletId: 'wallet-1',
        deviceKeyQuorumId: 'q-1',
      })
      mockEnsureNeckKeyPair.mockResolvedValue({
        privateKey: 'mock-private-key',
        publicKeyBase64: 'mock-key',
        isFresh: false,
      })
      mockFetchChallengeRequest.mockResolvedValue({
        signingPayload: undefined,
        sessionActive: false,
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
      mockRefreshNeckSession.mockResolvedValue(undefined)

      await expect(signMessageWithPasskey('hello')).rejects.toThrow('Challenge did not return a signing payload')
    })

    it('fires a second refreshNeckSession when post-upfront-refresh Challenge still returns sessionActive: false', async () => {
      // isFresh: true triggers an upfront refresh. If the server hasn't propagated
      // the new NECK registration by the first Challenge (rare timing), the code
      // must fire a second refreshNeckSession and re-Challenge.
      mockLoadNeckMetadata.mockReturnValue(null)
      mockEnsureNeckKeyPair.mockResolvedValue({
        privateKey: 'mock-generated-private-key',
        publicKeyBase64: 'mock-generated-public-key',
        isFresh: true,
      })
      mockFetchChallengeRequest
        .mockResolvedValueOnce({
          signingPayload: 'first-payload',
          sessionActive: false,
        } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
        .mockResolvedValueOnce({
          signingPayload: 'second-payload',
          sessionActive: true,
        } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
      mockRefreshNeckSession.mockResolvedValue(undefined)
      mockSignWithDeviceKey.mockResolvedValue('mock-device-signature')
      mockFetchSignMessagesRequest.mockResolvedValue({
        signatures: ['0xsig-after-double-refresh'],
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchSignMessagesRequest>>)

      const result = await signMessageWithPasskey('hello', 'wallet-1')

      expect(result).toBe('0xsig-after-double-refresh')
      // Two refreshes: one upfront (isFresh: true), one for the not-yet-active Challenge
      expect(mockRefreshNeckSession).toHaveBeenCalledTimes(2)
      expect(mockFetchChallengeRequest).toHaveBeenCalledTimes(2)
      // Second (post-recovery) Challenge's payload is what was signed
      expect(mockSignWithDeviceKey).toHaveBeenCalledWith('mock-generated-private-key', 'second-payload')
    })
  })

  describe('signTransactionWithPasskey', () => {
    it('calls through correctly with device auth', async () => {
      setupDeviceSessionMocks()
      mockFetchSignTransactionsRequest.mockResolvedValue({
        signatures: ['0xtxsig'],
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchSignTransactionsRequest>>)

      const result = await signTransactionWithPasskey('0xtxdata')

      expect(result).toBe('0xtxsig')
      expect(mockFetchChallengeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: MOCK_ACTION.SIGN_TRANSACTION,
          transaction: '0xtxdata',
        }),
      )
      expect(mockFetchSignTransactionsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          transactions: ['0xtxdata'],
          auth: expect.objectContaining({ case: 'deviceAuth' }),
        }),
      )
    })
  })

  describe('signTypedDataWithPasskey', () => {
    it('calls through correctly with device auth', async () => {
      setupDeviceSessionMocks()
      mockFetchSignTypedDataRequest.mockResolvedValue({
        signatures: ['0xtypedsig'],
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchSignTypedDataRequest>>)

      const result = await signTypedDataWithPasskey('{"type":"data"}')

      expect(result).toBe('0xtypedsig')
      expect(mockFetchChallengeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: MOCK_ACTION.SIGN_TYPED_DATA,
          typedData: '{"type":"data"}',
        }),
      )
      expect(mockFetchSignTypedDataRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          typedDataBatch: ['{"type":"data"}'],
          auth: expect.objectContaining({ case: 'deviceAuth' }),
        }),
      )
    })
  })

  describe('exportEncryptedSeedPhrase', () => {
    it('challenges, runs the default getCredential, and returns ciphertext + encapsulatedKey', async () => {
      mockFetchChallengeRequest.mockResolvedValue({
        challengeOptions: 'opts-1',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
      mockAuthenticatePasskey.mockResolvedValue('export-cred')
      mockFetchExportEncryptedSeedPhraseRequest.mockResolvedValue({
        ciphertext: 'ct',
        encapsulatedKey: 'ek',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchExportEncryptedSeedPhraseRequest>>)

      const result = await exportEncryptedSeedPhrase({ encryptionKey: 'enc-key-1', walletId: 'wallet-1' })

      expect(result).toEqual({ ciphertext: 'ct', encapsulatedKey: 'ek' })
      expect(mockFetchChallengeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: MOCK_ACTION.EXPORT_SEED_PHRASE,
          walletId: 'wallet-1',
          encryptionKey: 'enc-key-1',
        }),
      )
      expect(mockFetchExportEncryptedSeedPhraseRequest).toHaveBeenCalledWith({
        encryptionKey: 'enc-key-1',
        credential: 'export-cred',
      })
    })

    it('delegates to a custom getCredential callback (extension bridge)', async () => {
      mockFetchChallengeRequest.mockResolvedValue({
        challengeOptions: 'opts-1',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
      mockFetchExportEncryptedSeedPhraseRequest.mockResolvedValue({
        ciphertext: 'ct',
        encapsulatedKey: 'ek',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchExportEncryptedSeedPhraseRequest>>)
      const getCredential = vi.fn().mockResolvedValue('popup-cred')

      const result = await exportEncryptedSeedPhrase({
        encryptionKey: 'enc-key-1',
        walletId: 'wallet-1',
        getCredential,
        walletAddress: '0xabc',
      })

      expect(result).toEqual({ ciphertext: 'ct', encapsulatedKey: 'ek' })
      expect(getCredential).toHaveBeenCalledWith({ challengeOptions: 'opts-1', walletAddress: '0xabc' })
      expect(mockAuthenticatePasskey).not.toHaveBeenCalled()
    })

    it('returns undefined when the challenge produces no challengeOptions', async () => {
      mockFetchChallengeRequest.mockResolvedValue({
        challengeOptions: '',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)

      const result = await exportEncryptedSeedPhrase({ encryptionKey: 'enc-key-1' })

      expect(result).toBeUndefined()
      expect(mockFetchExportEncryptedSeedPhraseRequest).not.toHaveBeenCalled()
    })

    it('returns undefined when getCredential returns no credential', async () => {
      mockFetchChallengeRequest.mockResolvedValue({
        challengeOptions: 'opts-1',
      } as unknown as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
      const getCredential = vi.fn().mockResolvedValue(undefined)

      const result = await exportEncryptedSeedPhrase({
        encryptionKey: 'enc-key-1',
        walletId: 'wallet-1',
        getCredential,
      })

      expect(result).toBeUndefined()
      expect(mockFetchExportEncryptedSeedPhraseRequest).not.toHaveBeenCalled()
    })
  })

  describe('sign7702AuthorizationWithPasskey', () => {
    it('sends devicePublicKey in challenge and returns correct shape', async () => {
      setupDeviceSessionMocks()
      mockFetchSign7702Auth.mockResolvedValue({
        contractAddress: '0xcontract',
        chainId: 130,
        nonce: 5,
        r: '0xr',
        s: '0xs',
        yParity: 1,
      })

      const result = await sign7702AuthorizationWithPasskey({
        contractAddress: '0xcontract',
        chainId: 130,
        nonce: 5,
        walletId: 'wallet-1',
      })

      expect(result).toEqual({
        contractAddress: '0xcontract',
        chainId: 130,
        nonce: 5,
        r: '0xr',
        s: '0xs',
        yParity: 1,
      })
      expect(mockFetchChallengeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 14,
          walletId: 'wallet-1',
          devicePublicKey: 'mock-device-public-key',
          authorizationContractAddress: '0xcontract',
          authorizationChainId: '130',
          authorizationNonce: '5',
        }),
      )
      expect(mockFetchSign7702Auth).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress: '0xcontract',
          chainId: 130,
          nonce: 5,
          auth: {
            case: 'deviceAuth',
            value: {
              deviceSignature: 'mock-device-signature',
              walletId: 'wallet-1',
              signingPayload: 'mock-signing-payload',
            },
          },
        }),
      )
    })

    it('refreshes NECK session when not active', async () => {
      setupNoSessionMocks()
      mockFetchSign7702Auth.mockResolvedValue({
        contractAddress: '0xcontract',
        chainId: 130,
        nonce: 5,
        r: '0xr',
        s: '0xs',
        yParity: 0,
      })

      const result = await sign7702AuthorizationWithPasskey({
        contractAddress: '0xcontract',
        chainId: 130,
        nonce: 5,
        walletId: 'wallet-1',
      })

      expect(result.yParity).toBe(0)
      expect(mockRefreshNeckSession).toHaveBeenCalled()
      expect(mockFetchChallengeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          devicePublicKey: 'mock-generated-public-key',
        }),
      )
    })

    it('throws when no walletId available', async () => {
      mockLoadNeckMetadata.mockReturnValue(null)
      // No walletId passed + no metadata → throws before ensureNeckKeyPair is called

      await expect(
        sign7702AuthorizationWithPasskey({ contractAddress: '0xcontract', chainId: 130, nonce: 5 }),
      ).rejects.toThrow()
    })
  })

  describe('sign7702TransactionWithPasskey', () => {
    const txParams = {
      to: '0xrecipient',
      data: '0xcalldata',
      value: '0',
      chainId: 130,
      gas: '100000',
      maxFeePerGas: '1000',
      maxPriorityFeePerGas: '100',
      nonce: 5,
      authorization: { contractAddress: '0xcontract', chainId: 130, nonce: 6, r: '0xr', s: '0xs', yParity: 0 },
      walletId: 'wallet-1',
    }

    it('sends devicePublicKey in challenge and returns signed transaction', async () => {
      setupDeviceSessionMocks()
      mockFetchSign7702Tx.mockResolvedValue({ signedTransaction: '0xsignedtype4' })

      const result = await sign7702TransactionWithPasskey(txParams)

      expect(result).toBe('0xsignedtype4')
      expect(mockFetchChallengeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 15,
          walletId: 'wallet-1',
          devicePublicKey: 'mock-device-public-key',
        }),
      )
      expect(mockFetchSign7702Tx).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '0xrecipient',
          chainId: 130,
          authorizationContractAddress: '0xcontract',
          auth: {
            case: 'deviceAuth',
            value: {
              deviceSignature: 'mock-device-signature',
              walletId: 'wallet-1',
              signingPayload: 'mock-signing-payload',
            },
          },
        }),
      )
    })

    it('refreshes NECK session when not active', async () => {
      setupNoSessionMocks()
      mockFetchSign7702Tx.mockResolvedValue({ signedTransaction: '0xsignedtype4device' })

      const result = await sign7702TransactionWithPasskey(txParams)

      expect(result).toBe('0xsignedtype4device')
      expect(mockRefreshNeckSession).toHaveBeenCalled()
    })
  })
})
