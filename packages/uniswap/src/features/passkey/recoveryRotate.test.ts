import {
  Action,
  AuthenticationTypes,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { rotateRecoveryWithRecoveryAuth } from 'uniswap/src/features/passkey/recoveryRotate'
import { encryptAndStoreRecovery } from 'uniswap/src/features/passkey/recoverySetup'

vi.mock('uniswap/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchChallengeRequest: vi.fn(),
    fetchSetupRecovery: vi.fn(),
  },
}))

vi.mock('uniswap/src/features/passkey/recoverySetup', () => ({
  encryptAndStoreRecovery: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/pinCrypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/passkey/pinCrypto')>()
  return { ...actual, signWithAuthKey: vi.fn(() => 'auth-key-sig') }
})

vi.mock('uniswap/src/features/passkey/recoveryExecute', () => ({
  decodeSigningPayload: vi.fn(() => ({
    payloadBytes: new Uint8Array([1, 2, 3]),
    payloadObject: { method: 'PATCH', url: 'https://api.privy.io/v1/key_quorums/owner' },
  })),
}))

const baseParams = {
  recoveredAuthPrivateKey: new Uint8Array(32).fill(7),
  newPin: '4321',
  email: 'user@example.com',
  accessToken: 'access-token',
  privyAppId: 'app-id',
  walletId: 'wallet-123',
  privyUserId: 'privy-user-1',
  authMethodType: 'EMAIL' as const,
  generateAuthorizationSignature: vi.fn(async () => ({ signature: 'recovery-auth-sig' })),
}

// A base64url string standing in for the Challenge(SETUP_RECOVERY) swap payload; decoding is mocked.
const SWAP_PAYLOAD = 'eyJtZXRob2QiOiJQQVRDSCJ9'

describe('rotateRecoveryWithRecoveryAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(encryptAndStoreRecovery).mockResolvedValue({
      publicKey: 'new-v2-pubkey',
      authMethodId: 'auth-method-id',
      encryptedKeyId: 'new-key-id',
      authPrivateKey: new Uint8Array(32).fill(3),
    })
    vi.mocked(EmbeddedWalletApiClient.fetchChallengeRequest).mockResolvedValue({
      challengeOptions: JSON.stringify({ challenge: SWAP_PAYLOAD, rpId: 'localhost' }),
    } as never)
    vi.mocked(EmbeddedWalletApiClient.fetchSetupRecovery).mockResolvedValue({ success: true } as never)
  })

  it('encrypts a fresh v2 blob (rotate:true) and retains the new key', async () => {
    await rotateRecoveryWithRecoveryAuth(baseParams)
    expect(encryptAndStoreRecovery).toHaveBeenCalledWith(
      expect.objectContaining({ pin: '4321', email: 'user@example.com', rotate: true, retainPrivateKey: true }),
    )
  })

  it('returns the new v2 auth key + config ids for the caller', async () => {
    const result = await rotateRecoveryWithRecoveryAuth(baseParams)
    expect(result.authMethodId).toBe('auth-method-id')
    expect(result.encryptedKeyId).toBe('new-key-id')
    expect(result.newAuthPrivateKey.some((b) => b !== 0)).toBe(true)
  })

  it('requests a SETUP_RECOVERY challenge with the new auth key + wallet/user ids', async () => {
    await rotateRecoveryWithRecoveryAuth(baseParams)
    expect(EmbeddedWalletApiClient.fetchChallengeRequest).toHaveBeenCalledWith({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action: Action.SETUP_RECOVERY,
      walletId: 'wallet-123',
      authPublicKey: 'new-v2-pubkey',
      privyUserId: 'privy-user-1',
    })
  })

  it('completes SetupRecovery with recovery-auth signatures and the swap payload, no credential', async () => {
    await rotateRecoveryWithRecoveryAuth(baseParams)
    expect(baseParams.generateAuthorizationSignature).toHaveBeenCalledWith({
      method: 'PATCH',
      url: 'https://api.privy.io/v1/key_quorums/owner',
    })
    const call = vi.mocked(EmbeddedWalletApiClient.fetchSetupRecovery).mock.calls[0]?.[0]
    expect(call).toEqual({
      authMethodId: 'auth-method-id',
      authMethodType: 'EMAIL',
      authMethodIdentifier: 'user@example.com',
      encryptedKeyId: 'new-key-id',
      authKeySignature: 'auth-key-sig',
      recoveryAuthSignature: 'recovery-auth-sig',
      signingPayload: SWAP_PAYLOAD,
    })
    expect(call).not.toHaveProperty('credential')
  })

  it('zeros the recovered v1 key on success but not the returned v2 key', async () => {
    const key = new Uint8Array(32).fill(9)
    const result = await rotateRecoveryWithRecoveryAuth({ ...baseParams, recoveredAuthPrivateKey: key })
    expect(key.every((b) => b === 0)).toBe(true)
    expect(result.newAuthPrivateKey.some((b) => b !== 0)).toBe(true)
  })

  it('throws (and zeros the key) when the challenge has no options', async () => {
    vi.mocked(EmbeddedWalletApiClient.fetchChallengeRequest).mockResolvedValue({} as never)
    const key = new Uint8Array(32).fill(5)
    await expect(rotateRecoveryWithRecoveryAuth({ ...baseParams, recoveredAuthPrivateKey: key })).rejects.toThrow()
    expect(key.every((b) => b === 0)).toBe(true)
    expect(EmbeddedWalletApiClient.fetchSetupRecovery).not.toHaveBeenCalled()
  })

  it('throws when the backend does not confirm the rotation', async () => {
    vi.mocked(EmbeddedWalletApiClient.fetchSetupRecovery).mockResolvedValue({ success: false } as never)
    await expect(rotateRecoveryWithRecoveryAuth(baseParams)).rejects.toThrow()
  })
})
