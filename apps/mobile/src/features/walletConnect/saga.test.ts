import { WalletKitTypes } from '@reown/walletkit'
import { ProposalTypes, Verify } from '@walletconnect/types'
import { buildApprovedNamespaces, populateAuthPayload } from '@walletconnect/utils'
import { expectSaga } from 'redux-saga-test-plan'
import { handleSessionAuthenticate, handleSessionProposal } from 'src/features/walletConnect/saga'
import { parseVerifyStatus } from 'src/features/walletConnect/utils'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import { addPendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DappRequestInfo, DappRequestType, EthEvent } from 'uniswap/src/types/walletConnect'
import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

// Mock for WalletConnect utils
jest.mock('@walletconnect/utils', () => ({
  ...jest.requireActual('@walletconnect/utils'),
  buildApprovedNamespaces: jest.fn(),
  getSdkError: jest.fn(() => 'mocked-error'),
  populateAuthPayload: jest.fn(),
  parseVerifyStatus: jest.fn(),
}))

// Mock dependencies
jest.mock('./walletConnectClient', () => ({
  wcWeb3Wallet: {
    rejectSession: jest.fn(),
    formatAuthMessage: jest.fn(),
  },
}))

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}))

// Mock i18n
jest.mock('uniswap/src/i18n', () => ({
  t: jest.fn((key) => key),
}))

// Mock parseVerifyStatus from utils
jest.mock('src/features/walletConnect/utils', () => ({
  ...jest.requireActual('src/features/walletConnect/utils'),
  parseVerifyStatus: jest.fn(),
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
      const buildApprovedNamespacesMock = buildApprovedNamespaces as jest.Mock
      buildApprovedNamespacesMock.mockReturnValue(mockNamespaces)

      // Mock parseVerifyStatus to return VERIFIED for this test
      const parseVerifyStatusMock = parseVerifyStatus as jest.Mock
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
      const buildApprovedNamespacesMock = buildApprovedNamespaces as jest.Mock
      buildApprovedNamespacesMock.mockReturnValue(mockNamespaces)

      // Mock parseVerifyStatus to return VERIFIED for this test
      const parseVerifyStatusMock = parseVerifyStatus as jest.Mock
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
      const buildApprovedNamespacesMock = buildApprovedNamespaces as jest.Mock
      buildApprovedNamespacesMock.mockReturnValue(mockNamespaces)

      // Mock parseVerifyStatus to return UNVERIFIED when no verifyContext
      const parseVerifyStatusMock = parseVerifyStatus as jest.Mock
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
      const populateAuthPayloadMock = populateAuthPayload as jest.Mock
      populateAuthPayloadMock.mockReturnValue(mockPopulatedAuthPayload)

      // Mock auth message
      const mockAuthMessage = 'SIWE Message: Auth request from auth-dapp.com (nonce: 1234567890)'

      // Mock formatAuthMessage
      wcWeb3Wallet.formatAuthMessage = jest.fn().mockReturnValue(mockAuthMessage)

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
