import { WalletKitTypes } from '@reown/walletkit'
import { PendingRequestTypes, ProposalTypes, Verify } from '@walletconnect/types'
import { buildApprovedNamespaces, populateAuthPayload } from '@walletconnect/utils'
import { expectSaga } from 'redux-saga-test-plan'
import {
  disconnectSessionsForRemovedAccounts,
  handleSessionAuthenticate,
  handleSessionProposal,
  handleSessionRequest,
  populateActiveSessions,
} from 'src/features/walletConnect/saga'
import { parseVerifyStatus } from 'src/features/walletConnect/utils'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import { addPendingSession, addSession, removeSession } from 'src/features/walletConnect/walletConnectSlice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { DappRequestInfo, DappRequestType, EthEvent } from 'uniswap/src/types/walletConnect'
import type { Mock } from 'vitest'
import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { removeAccounts as removeAccountsAction } from 'wallet/src/features/wallet/slice'

// Mock for WalletConnect utils
vi.mock('@walletconnect/utils', async () => ({
  ...(await vi.importActual('@walletconnect/utils')),
  buildApprovedNamespaces: vi.fn(),
  getSdkError: vi.fn(() => 'mocked-error'),
  populateAuthPayload: vi.fn(),
}))

// Enable EIP-5792 methods so wallet_getCapabilities
// reaches the namespace check when it's called
vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  getFeatureFlag: vi.fn(() => true),
}))

// Mock dependencies
vi.mock('./walletConnectClient', () => ({
  wcWeb3Wallet: {
    rejectSession: vi.fn(),
    formatAuthMessage: vi.fn(),
    getActiveSessions: vi.fn(),
    disconnectSession: vi.fn(),
    respondSessionRequest: vi.fn(),
    engine: {
      signClient: {
        session: {
          get: vi.fn(),
        },
      },
    },
  },
}))

vi.mock('react-native', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  Alert: {
    alert: vi.fn(),
  },
}))

// Mock i18n
vi.mock('uniswap/src/i18n', () => ({
  t: vi.fn((key) => key),
}))

// Mock parseVerifyStatus from utils
vi.mock('src/features/walletConnect/utils', async () => ({
  ...(await vi.importActual('src/features/walletConnect/utils')),
  parseVerifyStatus: vi.fn(),
}))

describe('WalletConnect Saga', () => {
  describe('handleSessionProposal', () => {
    it('uses verifyContext.verified.origin as URL when available', () => {
      // Create a mock verification context with origin URL different from dapp URL
      const mockVerifyContext: Verify.Context = {
        verified: {
          verifyUrl: 'https://verify.walletconnect.com',
          validation: 'VALID',
          origin: 'https://verified-origin.com', // Different from dapp.url
        },
      }

      // Create a valid proposal with eip155 namespace
      const mockProposal = {
        id: 789,
        proposer: {
          publicKey: 'test-public-key',
          metadata: {
            name: 'Test Dapp',
            description: 'Test Dapp Description',
            url: 'https://original-dapp.com', // This should NOT be used when verified origin is available
            icons: ['https://original-dapp.com/icon.png'],
          },
        },
        relays: [],
        optionalNamespaces: {
          eip155: {
            chains: ['eip155:1'],
            methods: ['eth_signTransaction'],
            events: [],
          },
        },
        pairingTopic: 'test-pairing-topic',
        expiryTimestamp: Date.now() + 1000 * 60 * 5,
        verifyContext: mockVerifyContext,
      } as unknown as ProposalTypes.Struct & { verifyContext?: Verify.Context }

      const activeAccountAddress = '0x1234567890abcdef'

      // Mock namespaces that would be returned by buildApprovedNamespaces
      const mockNamespaces = {
        eip155: {
          accounts: [`eip155:1:${activeAccountAddress}`],
          chains: ['eip155:1'],
          methods: ['eth_signTransaction'],
          events: [EthEvent.AccountsChanged, EthEvent.ChainChanged],
        },
      }

      // Mock the buildApprovedNamespaces function to return our mock namespaces
      const buildApprovedNamespacesMock = buildApprovedNamespaces as Mock
      buildApprovedNamespacesMock.mockReturnValue(mockNamespaces)

      // Mock parseVerifyStatus to return VERIFIED for this test
      const parseVerifyStatusMock = parseVerifyStatus as Mock
      parseVerifyStatusMock.mockReturnValue('VERIFIED')

      // Create properly typed dappRequestInfo
      const dappRequestInfo: DappRequestInfo = {
        name: 'Test Dapp',
        url: 'https://verified-origin.com', // Should use verified origin, NOT dapp.url
        icon: 'https://original-dapp.com/icon.png',
        requestType: DappRequestType.WalletConnectSessionRequest,
      }

      const expectedPendingSession = {
        wcSession: {
          id: '789',
          proposalNamespaces: mockNamespaces,
          chains: [UniverseChainId.Mainnet],
          dappRequestInfo,
          verifyStatus: DappVerificationStatus.Verified,
          trustedOriginUrl: 'https://verified-origin.com',
        },
      }

      return expectSaga(handleSessionProposal, mockProposal)
        .provide({
          select({ selector }, next) {
            if (selector === selectActiveAccountAddress) {
              return activeAccountAddress
            }
            return next()
          },
        })
        .withState({
          userSettings: {},
          wallet: {
            accounts: {
              [activeAccountAddress]: { address: activeAccountAddress },
            },
          },
        })
        .put(addPendingSession(expectedPendingSession))
        .run()
    })

    it('dispatches addPendingSession with correct parameters for valid proposal', () => {
      // Create a mock verification context for the verified status
      const mockVerifyContext: Verify.Context = {
        verified: {
          verifyUrl: 'https://verify.walletconnect.com',
          validation: 'VALID',
          origin: 'https://valid-dapp.com',
        },
      }

      // Create a valid proposal with eip155 namespace
      const mockProposal = {
        id: 456,
        proposer: {
          publicKey: 'test-public-key',
          metadata: {
            name: 'Valid Dapp',
            description: 'Valid Dapp Description',
            url: 'https://valid-dapp.com',
            icons: ['https://valid-dapp.com/icon.png'],
          },
        },
        relays: [],
        optionalNamespaces: {
          eip155: {
            chains: ['eip155:1'],
            methods: ['eth_signTransaction'],
            events: [],
          },
        },
        pairingTopic: 'valid-pairing-topic',
        expiryTimestamp: Date.now() + 1000 * 60 * 5,
        verifyContext: mockVerifyContext,
      } as unknown as ProposalTypes.Struct & { verifyContext?: Verify.Context }

      const activeAccountAddress = '0x1234567890abcdef'

      // Mock namespaces that would be returned by buildApprovedNamespaces
      const mockNamespaces = {
        eip155: {
          accounts: [`eip155:1:${activeAccountAddress}`],
          chains: ['eip155:1'],
          methods: ['eth_signTransaction'],
          events: [EthEvent.AccountsChanged, EthEvent.ChainChanged],
        },
      }

      // Mock the buildApprovedNamespaces function to return our mock namespaces
      const buildApprovedNamespacesMock = buildApprovedNamespaces as Mock
      buildApprovedNamespacesMock.mockReturnValue(mockNamespaces)

      // Mock parseVerifyStatus to return VERIFIED for this test
      const parseVerifyStatusMock = parseVerifyStatus as Mock
      parseVerifyStatusMock.mockReturnValue('VERIFIED')

      // Create properly typed dappRequestInfo
      const dappRequestInfo: DappRequestInfo = {
        name: 'Valid Dapp',
        url: 'https://valid-dapp.com',
        icon: 'https://valid-dapp.com/icon.png',
        requestType: DappRequestType.WalletConnectSessionRequest,
      }

      const expectedPendingSession = {
        wcSession: {
          id: '456',
          proposalNamespaces: mockNamespaces,
          chains: [UniverseChainId.Mainnet],
          dappRequestInfo,
          verifyStatus: DappVerificationStatus.Verified,
          trustedOriginUrl: 'https://valid-dapp.com',
        },
      }

      return expectSaga(handleSessionProposal, mockProposal)
        .provide({
          select({ selector }, next) {
            if (selector === selectActiveAccountAddress) {
              return activeAccountAddress
            }
            // For any other selectors that might access wallet state
            return next()
          },
        })
        .withState({
          userSettings: {},
          wallet: {
            accounts: {
              [activeAccountAddress]: { address: activeAccountAddress },
            },
          },
        })
        .put(addPendingSession(expectedPendingSession))
        .run()
    })

    it('falls back to dapp.url when verifyContext.verified.origin is not available', () => {
      // Create a proposal WITHOUT verifyContext.verified.origin
      const mockProposal = {
        id: 999,
        proposer: {
          publicKey: 'test-public-key',
          metadata: {
            name: 'Fallback Dapp',
            description: 'Fallback Dapp Description',
            url: 'https://fallback-dapp.com',
            icons: ['https://fallback-dapp.com/icon.png'],
          },
        },
        relays: [],
        optionalNamespaces: {
          eip155: {
            chains: ['eip155:1'],
            methods: ['eth_signTransaction'],
            events: [],
          },
        },
        pairingTopic: 'fallback-pairing-topic',
        expiryTimestamp: Date.now() + 1000 * 60 * 5,
        // No verifyContext provided
      } as unknown as ProposalTypes.Struct & { verifyContext?: Verify.Context }

      const activeAccountAddress = '0x1234567890abcdef'

      // Mock namespaces that would be returned by buildApprovedNamespaces
      const mockNamespaces = {
        eip155: {
          accounts: [`eip155:1:${activeAccountAddress}`],
          chains: ['eip155:1'],
          methods: ['eth_signTransaction'],
          events: [EthEvent.AccountsChanged, EthEvent.ChainChanged],
        },
      }

      // Mock the buildApprovedNamespaces function to return our mock namespaces
      const buildApprovedNamespacesMock = buildApprovedNamespaces as Mock
      buildApprovedNamespacesMock.mockReturnValue(mockNamespaces)

      // Mock parseVerifyStatus to return UNVERIFIED when no verifyContext
      const parseVerifyStatusMock = parseVerifyStatus as Mock
      parseVerifyStatusMock.mockReturnValue('UNVERIFIED')

      // Create properly typed dappRequestInfo - should use dapp.url as fallback
      const dappRequestInfo: DappRequestInfo = {
        name: 'Fallback Dapp',
        url: 'https://fallback-dapp.com', // Should fallback to dapp.url
        icon: 'https://fallback-dapp.com/icon.png',
        requestType: DappRequestType.WalletConnectSessionRequest,
      }

      const expectedPendingSession = {
        wcSession: {
          id: '999',
          proposalNamespaces: mockNamespaces,
          chains: [UniverseChainId.Mainnet],
          dappRequestInfo,
          verifyStatus: DappVerificationStatus.Unverified,
          trustedOriginUrl: undefined,
        },
      }

      return expectSaga(handleSessionProposal, mockProposal)
        .provide({
          select({ selector }, next) {
            if (selector === selectActiveAccountAddress) {
              return activeAccountAddress
            }
            return next()
          },
        })
        .withState({
          userSettings: {},
          wallet: {
            accounts: {
              [activeAccountAddress]: { address: activeAccountAddress },
            },
          },
        })
        .put(addPendingSession(expectedPendingSession))
        .run()
    })
  })

  describe('populateActiveSessions', () => {
    const mockAccount = '0xabc123'
    const mockAccounts = { [mockAccount]: { address: mockAccount } }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('restores valid sessions to store', async () => {
      const validSession = {
        topic: 'valid-topic',
        expiry: Math.floor(Date.now() / 1000) + 3600, // expires in 1 hour
        namespaces: {
          eip155: {
            accounts: [`eip155:1:${mockAccount}`],
            chains: ['eip155:1'],
            methods: [],
            events: [],
          },
        },
        peer: {
          metadata: { name: 'Test Dapp', url: 'https://test.com', icons: ['https://test.com/icon.png'] },
        },
      }

      ;(wcWeb3Wallet.getActiveSessions as Mock).mockReturnValue({ 'valid-topic': validSession })

      await expectSaga(populateActiveSessions)
        .withState({ wallet: { accounts: mockAccounts } })
        .put(
          addSession({
            wcSession: {
              id: 'valid-topic',
              dappRequestInfo: {
                name: 'Test Dapp',
                url: 'https://test.com',
                icon: 'https://test.com/icon.png',
                requestType: DappRequestType.WalletConnectSessionRequest,
              },
              chains: [UniverseChainId.Mainnet],
              namespaces: validSession.namespaces,
              activeAccount: mockAccount,
            },
          }),
        )
        .run()
    })

    it('disconnects expired sessions instead of restoring them', async () => {
      const expiredSession = {
        topic: 'expired-topic',
        expiry: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
        namespaces: {
          eip155: {
            accounts: [`eip155:1:${mockAccount}`],
            chains: ['eip155:1'],
            methods: [],
            events: [],
          },
        },
        peer: {
          metadata: { name: 'Expired Dapp', url: 'https://expired.com', icons: [] },
        },
      }

      ;(wcWeb3Wallet.getActiveSessions as Mock).mockReturnValue({ 'expired-topic': expiredSession })
      ;(wcWeb3Wallet.disconnectSession as Mock).mockResolvedValue(undefined)

      const result = await expectSaga(populateActiveSessions)
        .withState({ wallet: { accounts: mockAccounts } })
        .call([wcWeb3Wallet, wcWeb3Wallet.disconnectSession], {
          topic: 'expired-topic',
          reason: 'mocked-error',
        })
        .not.put.actionType('walletConnect/addSession')
        .run()

      expect(result.effects.put).toBeUndefined()
    })

    it('disconnects orphaned sessions whose accounts no longer exist', async () => {
      const orphanedSession = {
        topic: 'orphaned-topic',
        expiry: Math.floor(Date.now() / 1000) + 3600,
        namespaces: {
          eip155: {
            accounts: ['eip155:1:0xremoved_account'],
            chains: ['eip155:1'],
            methods: [],
            events: [],
          },
        },
        peer: {
          metadata: { name: 'Orphaned Dapp', url: 'https://orphaned.com', icons: [] },
        },
      }

      ;(wcWeb3Wallet.getActiveSessions as Mock).mockReturnValue({ 'orphaned-topic': orphanedSession })
      ;(wcWeb3Wallet.disconnectSession as Mock).mockResolvedValue(undefined)

      const result = await expectSaga(populateActiveSessions)
        .withState({ wallet: { accounts: mockAccounts } })
        .call([wcWeb3Wallet, wcWeb3Wallet.disconnectSession], {
          topic: 'orphaned-topic',
          reason: 'mocked-error',
        })
        .not.put.actionType('walletConnect/addSession')
        .run()

      expect(result.effects.put).toBeUndefined()
    })

    it('continues restoring other sessions if one disconnect fails', async () => {
      const expiredSession = {
        topic: 'expired-topic',
        expiry: Math.floor(Date.now() / 1000) - 3600,
        namespaces: {
          eip155: { accounts: [`eip155:1:${mockAccount}`], chains: ['eip155:1'], methods: [], events: [] },
        },
        peer: { metadata: { name: 'Expired', url: 'https://expired.com', icons: [] } },
      }
      const validSession = {
        topic: 'valid-topic',
        expiry: Math.floor(Date.now() / 1000) + 3600,
        namespaces: {
          eip155: { accounts: [`eip155:1:${mockAccount}`], chains: ['eip155:1'], methods: [], events: [] },
        },
        peer: { metadata: { name: 'Valid', url: 'https://valid.com', icons: ['https://valid.com/icon.png'] } },
      }

      ;(wcWeb3Wallet.getActiveSessions as Mock).mockReturnValue({
        'expired-topic': expiredSession,
        'valid-topic': validSession,
      })
      ;(wcWeb3Wallet.disconnectSession as Mock).mockRejectedValue(new Error('network error'))

      await expectSaga(populateActiveSessions)
        .withState({ wallet: { accounts: mockAccounts } })
        .put(
          addSession({
            wcSession: {
              id: 'valid-topic',
              dappRequestInfo: {
                name: 'Valid',
                url: 'https://valid.com',
                icon: 'https://valid.com/icon.png',
                requestType: DappRequestType.WalletConnectSessionRequest,
              },
              chains: [UniverseChainId.Mainnet],
              namespaces: validSession.namespaces,
              activeAccount: mockAccount,
            },
          }),
        )
        .run()
    })
  })

  describe('disconnectSessionsForRemovedAccounts', () => {
    const removedAddress = '0xremoved'

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('disconnects sessions associated with removed accounts', async () => {
      const session = {
        id: 'session-topic',
        chains: [UniverseChainId.Mainnet],
        dappRequestInfo: {
          name: 'Dapp',
          url: 'https://dapp.com',
          icon: null,
          requestType: DappRequestType.WalletConnectSessionRequest,
        },
        namespaces: {
          eip155: { accounts: [`eip155:1:${removedAddress}`], chains: ['eip155:1'], methods: [], events: [] },
        },
        activeAccount: removedAddress,
      }

      ;(wcWeb3Wallet.disconnectSession as Mock).mockResolvedValue(undefined)

      await expectSaga(disconnectSessionsForRemovedAccounts)
        .withState({
          walletConnect: { sessions: { 'session-topic': session } },
        })
        .dispatch(removeAccountsAction([removedAddress]))
        .call([wcWeb3Wallet, wcWeb3Wallet.disconnectSession], {
          topic: 'session-topic',
          reason: 'mocked-error',
        })
        .put(removeSession({ sessionId: 'session-topic' }))
        .silentRun()
    })

    it('does not disconnect sessions for unrelated accounts', async () => {
      const session = {
        id: 'session-topic',
        chains: [UniverseChainId.Mainnet],
        dappRequestInfo: {
          name: 'Dapp',
          url: 'https://dapp.com',
          icon: null,
          requestType: DappRequestType.WalletConnectSessionRequest,
        },
        namespaces: {
          eip155: { accounts: ['eip155:1:0xkeeping_this_account'], chains: ['eip155:1'], methods: [], events: [] },
        },
        activeAccount: '0xkeeping_this_account',
      }

      await expectSaga(disconnectSessionsForRemovedAccounts)
        .withState({
          walletConnect: { sessions: { 'session-topic': session } },
        })
        .dispatch(removeAccountsAction([removedAddress]))
        .not.call.fn(wcWeb3Wallet.disconnectSession)
        .not.put.actionType('walletConnect/removeSession')
        .silentRun()
    })
  })

  // Verify that the address asked to sign/send is
  // actually in the approved session namespace.
  describe('handleSessionRequest authorization', () => {
    const APPROVED_ACCOUNT = '0xaaaa000000000000000000000000000000000001'
    const UNAPPROVED_ACCOUNT = '0xbbbb000000000000000000000000000000000002'
    const SESSION_TOPIC = 'test-session-topic'

    const sessionWithOnlyApprovedAccount = {
      topic: SESSION_TOPIC,
      peer: {
        metadata: {
          name: 'Malicious Dapp',
          url: 'https://malicious.example',
          icons: [],
        },
      },
      namespaces: {
        eip155: {
          accounts: [`eip155:1:${APPROVED_ACCOUNT}`],
          chains: ['eip155:1'],
          methods: ['eth_sendTransaction', 'personal_sign'],
          events: [],
        },
      },
    }

    beforeEach(() => {
      vi.clearAllMocks()
      ;(wcWeb3Wallet.engine.signClient.session.get as Mock).mockReturnValue(sessionWithOnlyApprovedAccount)
    })

    it('rejects eth_sendTransaction whose `from` is not in the session namespace', async () => {
      const requestId = 101

      // Dapp asks the unapproved account
      // to sign a max ERC20 approval.
      const maliciousRequest = {
        topic: SESSION_TOPIC,
        id: requestId,
        params: {
          chainId: 'eip155:1',
          request: {
            method: EthMethod.EthSendTransaction,
            params: [
              {
                from: UNAPPROVED_ACCOUNT,
                to: '0x1111111111111111111111111111111111111111',
                data: '0x095ea7b3000000000000000000000000222222222222222222222222222222222222222200000000000000000000000000000000000000000000000000ffffffffffffffff',
                gasLimit: '0x5208',
                value: '0x0',
              },
            ],
          },
        },
      } as unknown as PendingRequestTypes.Struct

      await expectSaga(handleSessionRequest, maliciousRequest).not.put.actionType('walletConnect/addRequest').run()

      expect(wcWeb3Wallet.respondSessionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: SESSION_TOPIC,
          response: expect.objectContaining({
            id: requestId,
            jsonrpc: '2.0',
            error: expect.anything(),
          }),
        }),
      )
    })

    it('rejects personal_sign whose address is not in the session namespace', async () => {
      const requestId = 202

      const maliciousRequest = {
        topic: SESSION_TOPIC,
        id: requestId,
        params: {
          chainId: 'eip155:1',
          request: {
            method: EthMethod.PersonalSign,
            // `personal_sign` params are [message, address].
            params: ['0x68656c6c6f', UNAPPROVED_ACCOUNT],
          },
        },
      } as unknown as PendingRequestTypes.Struct

      await expectSaga(handleSessionRequest, maliciousRequest).not.put.actionType('walletConnect/addRequest').run()

      expect(wcWeb3Wallet.respondSessionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: SESSION_TOPIC,
          response: expect.objectContaining({
            id: requestId,
            jsonrpc: '2.0',
            error: expect.anything(),
          }),
        }),
      )
    })

    it('rejects wallet_getCapabilities whose address is not in the session namespace', async () => {
      const requestId = 303

      const maliciousRequest = {
        topic: SESSION_TOPIC,
        id: requestId,
        params: {
          chainId: 'eip155:1',
          request: {
            method: EthMethod.WalletGetCapabilities,
            // `wallet_getCapabilities` params are [address, chainIds?].
            params: [UNAPPROVED_ACCOUNT, ['0x1']],
          },
        },
      } as unknown as PendingRequestTypes.Struct

      await expectSaga(handleSessionRequest, maliciousRequest).run()

      expect(wcWeb3Wallet.respondSessionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: SESSION_TOPIC,
          response: expect.objectContaining({
            id: requestId,
            jsonrpc: '2.0',
            error: expect.anything(),
          }),
        }),
      )
    })

    it('rejects wallet_sendCalls whose `from` is not in the session namespace', async () => {
      const requestId = 404

      const maliciousRequest = {
        topic: SESSION_TOPIC,
        id: requestId,
        params: {
          chainId: 'eip155:1',
          request: {
            method: EthMethod.WalletSendCalls,
            // `wallet_sendCalls` params are [{ from, calls, ... }].
            params: [
              {
                from: UNAPPROVED_ACCOUNT,
                version: '1.0',
                chainId: '0x1',
                calls: [
                  {
                    to: '0x1111111111111111111111111111111111111111',
                    data: '0x095ea7b3000000000000000000000000222222222222222222222222222222222222222200000000000000000000000000000000000000000000000000ffffffffffffffff',
                    value: '0x0',
                  },
                ],
              },
            ],
          },
        },
      } as unknown as PendingRequestTypes.Struct

      await expectSaga(handleSessionRequest, maliciousRequest).not.put.actionType('walletConnect/addRequest').run()

      expect(wcWeb3Wallet.respondSessionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: SESSION_TOPIC,
          response: expect.objectContaining({
            id: requestId,
            jsonrpc: '2.0',
            error: expect.anything(),
          }),
        }),
      )
    })
  })

  describe('handleSessionAuthenticate', () => {
    it('processes authentication request', async () => {
      // Create a mock authentication request
      const mockAuthenticate = {
        id: 789,
        params: {
          requester: {
            metadata: {
              name: 'Auth Dapp',
              description: 'Auth Dapp Description',
              url: 'https://auth-dapp.com',
              icons: ['https://auth-dapp.com/icon.png'],
            },
          },
          authPayload: {
            chains: ['eip155:1', 'eip155:137', 'solana:1'], // Include both supported and unsupported chains
            domain: 'auth-dapp.com',
            aud: 'https://auth-dapp.com/login',
            nonce: '1234567890',
            type: 'eip4361',
          },
        },
      } as unknown as WalletKitTypes.SessionAuthenticate

      // User's active account
      const activeAccountAddress = '0x1234567890abcdef'

      // Expected formatted chains after filtering non-eip155 chains
      const formattedEip155Chains = ['eip155:1', 'eip155:137']

      // Mock populated auth payload with version and iat to satisfy type requirements
      const mockPopulatedAuthPayload = {
        chains: formattedEip155Chains,
        domain: 'auth-dapp.com',
        aud: 'https://auth-dapp.com/login',
        nonce: '1234567890',
        type: 'eip4361',
        methods: ['eth_signTransaction', 'eth_sign', 'personal_sign'],
        version: '1',
        iat: '2023-01-01T00:00:00Z',
      }

      // Set up mock for populateAuthPayload
      const populateAuthPayloadMock = populateAuthPayload as Mock
      populateAuthPayloadMock.mockReturnValue(mockPopulatedAuthPayload)

      // Mock auth message
      const mockAuthMessage = 'SIWE Message: Auth request from auth-dapp.com (nonce: 1234567890)'

      // Mock formatAuthMessage
      wcWeb3Wallet.formatAuthMessage = vi.fn().mockReturnValue(mockAuthMessage)

      // Run the saga and verify action is dispatched
      await expectSaga(handleSessionAuthenticate, mockAuthenticate)
        .provide({
          select({ selector }, next) {
            if (selector === selectActiveAccountAddress) {
              return activeAccountAddress
            }
            return next()
          },
        })
        .withState({
          userSettings: {},
          wallet: {
            accounts: {
              [activeAccountAddress]: { address: activeAccountAddress },
            },
          },
        })
        .put.actionType('walletConnect/addRequest')
        .run()
    })
  })
})
