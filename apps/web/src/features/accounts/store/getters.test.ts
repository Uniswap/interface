import { createAccountsStoreGetters } from 'features/accounts/store/getters'
import type { ExternalConnector, ExternalWallet, WebAccountsData } from 'features/accounts/store/types'
import { Account } from 'uniswap/src/features/accounts/store/types/Account'
import { AccessPattern, ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { ChainScopeType } from 'uniswap/src/features/accounts/store/types/Session'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

describe('Web Accounts Store Getters', () => {
  const createMockEVMConnector = (
    overrides: Partial<ExternalConnector<Platform.EVM>> = {},
  ): ExternalConnector<Platform.EVM> =>
    ({
      id: 'evm-connector-1',
      platform: Platform.EVM,
      access: AccessPattern.Injected,
      status: ConnectorStatus.Connected,
      externalLibraryId: 'metamask',
      session: {
        walletId: 'wallet-1',
        currentAccountIndex: 0,
        chainScope: {
          type: ChainScopeType.SingleChain,
          supportedChains: 'all',
          currentChain: { supportedByApp: true, currentChainId: 1 },
        },
      },
      ...overrides,
    }) as ExternalConnector<Platform.EVM>

  const createMockSVMConnector = (
    overrides: Partial<ExternalConnector<Platform.SVM>> = {},
  ): ExternalConnector<Platform.SVM> =>
    ({
      id: 'svm-connector-1',
      platform: Platform.SVM,
      access: AccessPattern.Injected,
      status: ConnectorStatus.Connected,
      externalLibraryId: 'phantom' as any,
      session: {
        walletId: 'wallet-1',
        currentAccountIndex: 0,
        chainScope: {
          type: ChainScopeType.SingleChain,
          supportedChains: 'all',
          currentChain: { supportedByApp: true, currentChainId: 501000101 },
        },
      },
      ...overrides,
    }) as ExternalConnector<Platform.SVM>

  const createMockWallet = (overrides: Partial<ExternalWallet> = {}): ExternalWallet => ({
    id: 'wallet-1',
    name: 'Test Wallet',
    icon: 'test-icon',
    signingCapability: SigningCapability.Interactive,
    addresses: [
      {
        evm: '0x1234567890123456789012345678901234567890',
        svm: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      },
    ],
    connectorIds: {
      evm: 'evm-connector-1',
      svm: 'svm-connector-1',
    },
    analyticsWalletType: 'test-analytics-wallet-type',
    ...overrides,
  })

  const createMockAccount = (overrides: Partial<Account<Platform>> = {}): Account<Platform> => ({
    platform: Platform.EVM,
    address: '0x1234567890123456789012345678901234567890',
    walletId: 'wallet-1',
    ...overrides,
  })

  const createMockState = (overrides: Partial<WebAccountsData> = {}): WebAccountsData => ({
    wallets: {
      'wallet-1': createMockWallet(),
    },
    connectors: {
      'evm-connector-1': createMockEVMConnector(),
      'svm-connector-1': createMockSVMConnector(),
    },
    accounts: {
      '0x1234567890123456789012345678901234567890': createMockAccount(),
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': createMockAccount({
        platform: Platform.SVM,
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      }),
    },
    activeConnectors: {
      evm: createMockEVMConnector(),
      svm: createMockSVMConnector(),
    },
    connectionQueryIsPending: false,
    ...overrides,
  })

  describe('getActiveConnector', () => {
    describe('Given a connected EVM connector', () => {
      it('When requesting the active EVM connector, Then it should return the EVM connector', () => {
        // Given
        const state = createMockState()
        const getters = createAccountsStoreGetters(() => state)

        // When
        const connector = getters.getActiveConnector(Platform.EVM)

        // Then
        expect(connector).toEqual(state.activeConnectors.evm)
        expect(connector?.platform).toBe(Platform.EVM)
      })

      it('When requesting the active EVM connector with string input, Then it should return the EVM connector', () => {
        // Given
        const state = createMockState()
        const getters = createAccountsStoreGetters(() => state)

        // When
        const connector = getters.getActiveConnector(Platform.EVM)

        // Then
        expect(connector).toEqual(state.activeConnectors.evm)
        expect(connector?.platform).toBe(Platform.EVM)
      })
    })

    describe('Given a connected SVM connector', () => {
      it('When requesting the active SVM connector, Then it should return the SVM connector', () => {
        // Given
        const state = createMockState()
        const getters = createAccountsStoreGetters(() => state)

        // When
        const connector = getters.getActiveConnector(Platform.SVM)

        // Then
        expect(connector).toEqual(state.activeConnectors.svm)
        expect(connector?.platform).toBe(Platform.SVM)
      })
    })

    describe('Given no active connectors', () => {
      it('When requesting any connector, Then it should return undefined', () => {
        // Given
        const state = createMockState({
          activeConnectors: {},
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const evmConnector = getters.getActiveConnector(Platform.EVM)
        const svmConnector = getters.getActiveConnector(Platform.SVM)

        // Then
        expect(evmConnector).toBeUndefined()
        expect(svmConnector).toBeUndefined()
      })
    })

    describe('Given disconnected connectors', () => {
      it('When requesting a disconnected connector, Then it should return the connector (web implementation includes disconnected in activeConnectors)', () => {
        // Given
        const state = createMockState({
          activeConnectors: {
            evm: createMockEVMConnector({ status: ConnectorStatus.Disconnected }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const connector = getters.getActiveConnector(Platform.EVM)

        // Then
        expect(connector).toBeDefined()
        expect(connector?.status).toBe(ConnectorStatus.Disconnected)
      })
    })
  })

  describe('getActiveWallet', () => {
    describe('Given a connected session with valid wallet', () => {
      it('When requesting the active wallet, Then it should return the wallet', () => {
        // Given
        const state = createMockState()
        const getters = createAccountsStoreGetters(() => state)

        // When
        const wallet = getters.getActiveWallet(Platform.EVM)

        // Then
        expect(wallet).toEqual(state.wallets['wallet-1'])
        expect(wallet?.id).toBe('wallet-1')
        expect(wallet?.name).toBe('Test Wallet')
      })
    })

    describe('Given a session with non-existent wallet ID', () => {
      it('When requesting the active wallet, Then it should return undefined', () => {
        // Given
        const state = createMockState({
          activeConnectors: {
            evm: createMockEVMConnector({
              session: {
                walletId: 'non-existent-wallet',
                currentAccountIndex: 0,
                chainScope: {
                  type: ChainScopeType.SingleChain,
                  supportedChains: 'all',
                  currentChain: { supportedByApp: true, currentChainId: 1 },
                },
              },
            }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const wallet = getters.getActiveWallet(Platform.EVM)

        // Then
        expect(wallet).toBeUndefined()
      })
    })

    describe('Given no active session', () => {
      it('When requesting the active wallet, Then it should return undefined', () => {
        // Given
        const state = createMockState({
          activeConnectors: {},
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const wallet = getters.getActiveWallet(Platform.EVM)

        // Then
        expect(wallet).toBeUndefined()
      })
    })
  })

  describe('getActiveAddress', () => {
    describe('Given a connected wallet with addresses', () => {
      it('When requesting the active EVM address, Then it should return the EVM address', () => {
        // Given
        const state = createMockState()
        const getters = createAccountsStoreGetters(() => state)

        // When
        const address = getters.getActiveAddress(Platform.EVM)

        // Then
        expect(address).toBe('0x1234567890123456789012345678901234567890')
      })

      it('When requesting the active SVM address, Then it should return the SVM address', () => {
        // Given
        const state = createMockState()
        const getters = createAccountsStoreGetters(() => state)

        // When
        const address = getters.getActiveAddress(Platform.SVM)

        // Then
        expect(address).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
      })
    })

    describe('Given a wallet with no address for the requested platform', () => {
      it('When requesting an address for a platform not supported by the wallet, Then it should return undefined', () => {
        // Given
        const state = createMockState({
          wallets: {
            'wallet-1': createMockWallet({
              addresses: [
                {
                  evm: '0x1234567890123456789012345678901234567890',
                  // No SVM address
                },
              ],
            }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const address = getters.getActiveAddress(Platform.SVM)

        // Then
        expect(address).toBeUndefined()
      })
    })

    describe('Given no active wallet', () => {
      it('When requesting an address, Then it should return undefined', () => {
        // Given
        const state = createMockState({
          activeConnectors: {},
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const address = getters.getActiveAddress(Platform.EVM)

        // Then
        expect(address).toBeUndefined()
      })
    })

    describe('Given a wallet with multiple address indices', () => {
      it('When requesting an address with a specific account index, Then it should return the correct address', () => {
        // Given
        const state = createMockState({
          wallets: {
            'wallet-1': createMockWallet({
              addresses: [
                {
                  evm: '0x1234567890123456789012345678901234567890',
                },
                {
                  evm: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
                },
              ],
            }),
          },
          activeConnectors: {
            evm: createMockEVMConnector({
              session: {
                walletId: 'wallet-1',
                currentAccountIndex: 1, // Second address
                chainScope: {
                  type: ChainScopeType.SingleChain,
                  supportedChains: 'all',
                  currentChain: { supportedByApp: true, currentChainId: 1 },
                },
              },
            }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const address = getters.getActiveAddress(Platform.EVM)

        // Then
        expect(address).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
      })
    })
  })

  describe('getActiveAddresses', () => {
    describe('Given connected wallets on both platforms', () => {
      it('When requesting all active addresses, Then it should return both EVM and SVM addresses', () => {
        // Given
        const state = createMockState()
        const getters = createAccountsStoreGetters(() => state)

        // When
        const addresses = getters.getActiveAddresses()

        // Then
        expect(addresses).toEqual({
          evmAddress: '0x1234567890123456789012345678901234567890',
          svmAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        })
      })
    })

    describe('Given only EVM wallet connected', () => {
      it('When requesting all active addresses, Then it should return only EVM address', () => {
        // Given
        const state = createMockState({
          activeConnectors: {
            evm: createMockEVMConnector(),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const addresses = getters.getActiveAddresses()

        // Then
        expect(addresses).toEqual({
          evmAddress: '0x1234567890123456789012345678901234567890',
          svmAddress: undefined,
        })
      })
    })

    describe('Given no connected wallets', () => {
      it('When requesting all active addresses, Then it should return undefined for both', () => {
        // Given
        const state = createMockState({
          activeConnectors: {},
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const addresses = getters.getActiveAddresses()

        // Then
        expect(addresses).toEqual({
          evmAddress: undefined,
          svmAddress: undefined,
        })
      })
    })
  })

  describe('getActiveAccount', () => {
    describe('Given a connected wallet with valid account', () => {
      it('When requesting the active EVM account, Then it should return the account with chain ID', () => {
        // Given
        const state = createMockState()
        const getters = createAccountsStoreGetters(() => state)

        // When
        const account = getters.getActiveAccount(Platform.EVM)

        // Then
        expect(account).toEqual({
          platform: Platform.EVM,
          address: '0x1234567890123456789012345678901234567890',
          walletId: 'wallet-1',
          chainId: 1,
        })
      })

      it('When requesting the active SVM account, Then it should return the account with chain ID', () => {
        // Given
        const state = createMockState()
        const getters = createAccountsStoreGetters(() => state)

        // When
        const account = getters.getActiveAccount(Platform.SVM)

        // Then
        expect(account).toEqual({
          platform: Platform.SVM,
          address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          walletId: 'wallet-1',
          chainId: 501000101,
        })
      })
    })

    describe('Given a wallet with no address for the requested platform', () => {
      it('When requesting an account for a platform not supported by the wallet, Then it should return undefined', () => {
        // Given
        const state = createMockState({
          wallets: {
            'wallet-1': createMockWallet({
              addresses: [
                {
                  evm: '0x1234567890123456789012345678901234567890',
                  // No SVM address
                },
              ],
            }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const account = getters.getActiveAccount(Platform.SVM)

        // Then
        expect(account).toBeUndefined()
      })
    })

    describe('Given an account that does not exist in the accounts store', () => {
      it('When requesting the active account, Then it should return undefined', () => {
        // Given
        const state = createMockState({
          accounts: {}, // No accounts
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const account = getters.getActiveAccount(Platform.EVM)

        // Then
        expect(account).toBeUndefined()
      })
    })

    describe('Given an account with mismatched platform', () => {
      it('When requesting the active account, Then it should throw an error', () => {
        // Given
        const state = createMockState({
          accounts: {
            '0x1234567890123456789012345678901234567890': createMockAccount({
              platform: Platform.SVM, // Wrong platform
            }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When & Then
        expect(() => getters.getActiveAccount(Platform.EVM)).toThrow(
          'Account 0x1234567890123456789012345678901234567890 is not on platform evm',
        )
      })
    })

    describe('Given no active wallet', () => {
      it('When requesting the active account, Then it should return undefined', () => {
        // Given
        const state = createMockState({
          activeConnectors: {},
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const account = getters.getActiveAccount(Platform.EVM)

        // Then
        expect(account).toBeUndefined()
      })
    })
  })

  describe('getConnectionStatus', () => {
    describe('Given a single connected connector', () => {
      it('When requesting connection status for that platform, Then it should return Connected', () => {
        // Given
        const state = createMockState()
        const getters = createAccountsStoreGetters(() => state)

        // When
        const status = getters.getConnectionStatus(Platform.EVM)

        // Then
        expect(status).toMatchObject({
          status: ConnectorStatus.Connected,
          isConnected: true,
          isConnecting: false,
          isDisconnected: false,
        })
      })
    })

    describe('Given a connecting connector', () => {
      it('When requesting connection status for that platform, Then it should return Connecting', () => {
        // Given
        const state = createMockState({
          activeConnectors: {
            evm: createMockEVMConnector({ status: ConnectorStatus.Connecting }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const status = getters.getConnectionStatus(Platform.EVM)

        // Then
        expect(status).toMatchObject({
          status: ConnectorStatus.Connecting,
          isConnected: false,
          isConnecting: true,
          isDisconnected: false,
        })
      })
    })

    describe('Given a disconnected connector', () => {
      it('When requesting connection status for that platform, Then it should return Disconnected', () => {
        // Given
        const state = createMockState({
          activeConnectors: {
            evm: createMockEVMConnector({ status: ConnectorStatus.Disconnected }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const status = getters.getConnectionStatus(Platform.EVM)

        // Then
        expect(status).toMatchObject({
          status: ConnectorStatus.Disconnected,
          isConnected: false,
          isConnecting: false,
          isDisconnected: true,
        })
      })
    })

    describe('Given no active connector for a platform', () => {
      it('When requesting connection status for that platform, Then it should return Disconnected', () => {
        // Given
        const state = createMockState({
          activeConnectors: {},
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const status = getters.getConnectionStatus(Platform.EVM)

        // Then
        expect(status).toMatchObject({
          status: ConnectorStatus.Disconnected,
          isConnected: false,
          isConnecting: false,
          isDisconnected: true,
        })
      })
    })

    describe('Given multiple connectors with different statuses', () => {
      it('When requesting overall connection status, Then it should return the highest priority status', () => {
        // Given
        const state = createMockState({
          activeConnectors: {
            evm: createMockEVMConnector({ status: ConnectorStatus.Connecting }),
            svm: createMockSVMConnector({ status: ConnectorStatus.Connected }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const status = getters.getConnectionStatus('aggregate')

        // Then
        expect(status).toMatchObject({
          status: ConnectorStatus.Connecting,
          isConnected: false,
          isConnecting: true,
          isDisconnected: false,
        }) // Connecting has higher priority than Connected
      })

      it('When requesting overall connection status with only connected connectors, Then it should return Connected', () => {
        // Given
        const state = createMockState({
          activeConnectors: {
            evm: createMockEVMConnector({ status: ConnectorStatus.Connected }),
            svm: createMockSVMConnector({ status: ConnectorStatus.Connected }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const status = getters.getConnectionStatus('aggregate')

        // Then
        expect(status).toMatchObject({
          status: ConnectorStatus.Connected,
          isConnected: true,
          isConnecting: false,
          isDisconnected: false,
        })
      })

      it('When requesting overall connection status with only disconnected connectors, Then it should return Disconnected', () => {
        // Given
        const state = createMockState({
          activeConnectors: {
            evm: createMockEVMConnector({ status: ConnectorStatus.Disconnected }),
            svm: createMockSVMConnector({ status: ConnectorStatus.Disconnected }),
          },
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const status = getters.getConnectionStatus('aggregate')

        // Then
        expect(status).toMatchObject({
          status: ConnectorStatus.Disconnected,
          isConnected: false,
          isConnecting: false,
          isDisconnected: true,
        })
      })
    })

    describe('Given no active connectors', () => {
      it('When requesting overall connection status, Then it should return Disconnected', () => {
        // Given
        const state = createMockState({
          activeConnectors: {},
        })
        const getters = createAccountsStoreGetters(() => state)

        // When
        const status = getters.getConnectionStatus('aggregate')

        // Then
        expect(status).toMatchObject({
          status: ConnectorStatus.Disconnected,
          isConnected: false,
          isConnecting: false,
          isDisconnected: true,
        })
      })
    })
  })
})
