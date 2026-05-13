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

      await client.fetchOprfEvaluate(
        { blindedElement: 'blinded', isRecovery: true, authMethodId: 'amid' },
        'fake-token',
      )

      expect(rpcClient.oprfEvaluate).toHaveBeenCalledWith(
        { blindedElement: 'blinded', isRecovery: true, authMethodId: 'amid' },
        { headers: { Authorization: 'Bearer fake-token' } },
      )
    })

    it('forwards the OPRF response from the rpc client', async () => {
      const rpcClient = makeRpcClient()
      vi.mocked(rpcClient.oprfEvaluate).mockResolvedValue({ evaluatedElement: 'eval' } as never)
      const client = createEmbeddedWalletApiClient({ rpcClient })

      const result = await client.fetchOprfEvaluate({ blindedElement: 'b' }, 'tok')
      expect(result).toEqual({ evaluatedElement: 'eval' })
    })
  })
})
