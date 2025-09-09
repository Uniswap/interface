import { WalletKitTypes } from '@reown/walletkit'
import { ProposalTypes, Verify } from '@walletconnect/types'
import { buildApprovedNamespaces, populateAuthPayload } from '@walletconnect/utils'
import { expectSaga } from 'redux-saga-test-plan'
import { handleSessionAuthenticate, handleSessionProposal } from 'src/features/walletConnect/saga'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import { WalletConnectVerifyStatus, addPendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DappRequestInfo, DappRequestType, EthEvent } from 'uniswap/src/types/walletConnect'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

// Mock for WalletConnect utils
jest.mock('@walletconnect/utils', () => ({
  ...jest.requireActual('@walletconnect/utils'),
  buildApprovedNamespaces: jest.fn(),
  getSdkError: jest.fn(() => 'mocked-error'),
  populateAuthPayload: jest.fn(),
  parseVerifyStatus: jest.fn(() => 'VERIFIED'),
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

describe('WalletConnect Saga', () => {
  describe('handleSessionProposal', () => {
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
          verifyStatus: 'VERIFIED' as WalletConnectVerifyStatus,
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
