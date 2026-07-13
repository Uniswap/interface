import 'utilities/src/logger/mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmbeddedWalletApiClient } from './createEmbeddedWalletApiClient'
import type { EmbeddedWalletClientContext } from './createEmbeddedWalletApiClient.types'

function makeRpcClient(): EmbeddedWalletClientContext['rpcClient'] {
  return {
    challenge: vi.fn(),
    createWallet: vi.fn(),
    walletSignIn: vi.fn(),
    signMessage: vi.fn(),
    signTransaction: vi.fn(),
    signTypedData: vi.fn(),
    disconnect: vi.fn(),
    listAuthenticators: vi.fn(),
    startAuthenticatedSession: vi.fn(),
    addAuthenticator: vi.fn(),
    deleteAuthenticator: vi.fn(),
    oprfEvaluate: vi.fn(),
    checkRecoveryAvailability: vi.fn(),
    setupRecovery: vi.fn(),
    executeRecovery: vi.fn(),
    reportDecryptionResult: vi.fn(),
    getRecoveryConfig: vi.fn(),
    deleteRecovery: vi.fn(),
    sign7702Authorization: vi.fn(),
    sign7702Transaction: vi.fn(),
    exportSeedPhrase: vi.fn(),
    exportSeedPhraseWithRecovery: vi.fn(),
  } as unknown as EmbeddedWalletClientContext['rpcClient']
}

describe('createEmbeddedWalletApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchOprfEvaluate', () => {
    it('attaches the Privy access token as a Bearer Authorization header', async () => {
      const rpcClient = makeRpcClient()
      vi.mocked(rpcClient.oprfEvaluate).mockResolvedValue({ evaluatedElement: 'eval' } as never)
      const client = createEmbeddedWalletApiClient({ rpcClient })

      await client.fetchOprfEvaluate({ blindedElement: 'blinded', authMethodId: 'amid' }, 'fake-token')

      expect(rpcClient.oprfEvaluate).toHaveBeenCalledWith(
        { blindedElement: 'blinded', authMethodId: 'amid' },
        { headers: { Authorization: 'Bearer fake-token' } },
      )
    })

    it('forwards the OPRF response from the rpc client', async () => {
      const rpcClient = makeRpcClient()
      vi.mocked(rpcClient.oprfEvaluate).mockResolvedValue({ evaluatedElement: 'eval' } as never)
      const client = createEmbeddedWalletApiClient({ rpcClient })

      const result = await client.fetchOprfEvaluate({ blindedElement: 'b', authMethodId: 'a' }, 'tok')
      expect(result).toEqual({ evaluatedElement: 'eval' })
    })
  })

  describe('fetchCheckRecoveryAvailability', () => {
    it('attaches the Privy access token as a Bearer Authorization header', async () => {
      const rpcClient = makeRpcClient()
      vi.mocked(rpcClient.checkRecoveryAvailability).mockResolvedValue({ available: true } as never)
      const client = createEmbeddedWalletApiClient({ rpcClient })

      await client.fetchCheckRecoveryAvailability({ authMethodId: 'amid' }, 'fake-token')

      expect(rpcClient.checkRecoveryAvailability).toHaveBeenCalledWith(
        { authMethodId: 'amid' },
        { headers: { Authorization: 'Bearer fake-token' } },
      )
    })

    it('forwards the response from the rpc client', async () => {
      const rpcClient = makeRpcClient()
      vi.mocked(rpcClient.checkRecoveryAvailability).mockResolvedValue({ available: false } as never)
      const client = createEmbeddedWalletApiClient({ rpcClient })

      const result = await client.fetchCheckRecoveryAvailability({ authMethodId: 'a' }, 'tok')
      expect(result).toEqual({ available: false })
    })
  })

  describe('fetchGetRecoveryConfig', () => {
    it('attaches the Privy access token as a Bearer Authorization header', async () => {
      const rpcClient = makeRpcClient()
      vi.mocked(rpcClient.getRecoveryConfig).mockResolvedValue({ found: true } as never)
      const client = createEmbeddedWalletApiClient({ rpcClient })

      await client.fetchGetRecoveryConfig({ authMethodId: 'amid' }, 'fake-token')

      expect(rpcClient.getRecoveryConfig).toHaveBeenCalledWith(
        { authMethodId: 'amid' },
        { headers: { Authorization: 'Bearer fake-token' } },
      )
    })

    it('forwards the response from the rpc client', async () => {
      const rpcClient = makeRpcClient()
      vi.mocked(rpcClient.getRecoveryConfig).mockResolvedValue({ found: false } as never)
      const client = createEmbeddedWalletApiClient({ rpcClient })

      const result = await client.fetchGetRecoveryConfig({ authMethodId: 'a' }, 'tok')
      expect(result).toEqual({ found: false })
    })
  })

  describe('fetchReportDecryptionResult', () => {
    it('attaches the Privy access token as a Bearer Authorization header', async () => {
      const rpcClient = makeRpcClient()
      vi.mocked(rpcClient.reportDecryptionResult).mockResolvedValue({ cooldownSeconds: 0 } as never)
      const client = createEmbeddedWalletApiClient({ rpcClient })

      await client.fetchReportDecryptionResult({ success: false, authMethodId: 'amid' }, 'fake-token')

      expect(rpcClient.reportDecryptionResult).toHaveBeenCalledWith(
        { success: false, authMethodId: 'amid' },
        { headers: { Authorization: 'Bearer fake-token' } },
      )
    })

    it('forwards the response from the rpc client', async () => {
      const rpcClient = makeRpcClient()
      vi.mocked(rpcClient.reportDecryptionResult).mockResolvedValue({ cooldownSeconds: 30 } as never)
      const client = createEmbeddedWalletApiClient({ rpcClient })

      const result = await client.fetchReportDecryptionResult(
        { success: true, authMethodId: 'a', newPasskeyPublicKey: 'pk' },
        'tok',
      )
      expect(result).toEqual({ cooldownSeconds: 30 })
    })
  })
})
