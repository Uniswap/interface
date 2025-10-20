import { AccessPattern, ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { ChainScopeType } from 'uniswap/src/features/accounts/store/types/Session'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { createAccountsStoreGetters } from 'wallet/src/features/accounts/store/getters'
import { WalletAppsAccountsData } from 'wallet/src/features/accounts/store/types'

const createMockState = (overrides: Partial<WalletAppsAccountsData> = {}): WalletAppsAccountsData => ({
  connectors: {
    local_connector: {
      id: 'local_connector',
      access: AccessPattern.Native,
      status: ConnectorStatus.Connected,
      session: {
        walletId: 'stored_mnemonic_wallet',
        currentAccountIndex: 0,
        chainScope: {
          type: ChainScopeType.MultiChain,
          supportedChains: 'all',
        },
      },
    },
  },
  localConnector: {
    id: 'local_connector',
    access: AccessPattern.Native,
    status: ConnectorStatus.Connected,
    session: {
      walletId: 'stored_mnemonic_wallet',
      currentAccountIndex: 0,
      chainScope: {
        type: ChainScopeType.MultiChain,
        supportedChains: 'all',
      },
    },
  },
  wallets: {
    stored_mnemonic_wallet: {
      id: 'stored_mnemonic_wallet',
      addresses: [
        {
          derivationIndex: 0,
          evm: '0x1234567890123456789012345678901234567890',
        },
        {
          derivationIndex: 1,
          evm: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        },
      ],
      signingCapability: SigningCapability.Immediate,
    },
    readonly_import_wallet: {
      id: 'readonly_import_wallet',
      addresses: [
        {
          evm: '0x9999999999999999999999999999999999999999',
        },
      ],
      signingCapability: SigningCapability.None,
      name: 'Readonly Wallet',
    },
  },
  accounts: {
    '0x1234567890123456789012345678901234567890': {
      walletId: 'stored_mnemonic_wallet',
      address: '0x1234567890123456789012345678901234567890',
      platform: Platform.EVM,
    },
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': {
      walletId: 'stored_mnemonic_wallet',
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      platform: Platform.EVM,
    },
    '0x9999999999999999999999999999999999999999': {
      walletId: 'readonly_import_wallet',
      address: '0x9999999999999999999999999999999999999999',
      platform: Platform.EVM,
    },
  },
  ...overrides,
})

describe('Wallet Accounts Store Getters', () => {
  describe('getActiveConnector', () => {
    it('should return local connector for EVM platform', () => {
      const state = createMockState()
      const getters = createAccountsStoreGetters(() => state)

      const connector = getters.getActiveConnector(Platform.EVM)
      expect(connector).toEqual(state.localConnector)
    })

    it('should return undefined for SVM platform (not implemented)', () => {
      const state = createMockState()
      const getters = createAccountsStoreGetters(() => state)

      const connector = getters.getActiveConnector(Platform.SVM)
      expect(connector).toBeUndefined()
    })

    it('should handle flexible platform input', () => {
      const state = createMockState()
      const getters = createAccountsStoreGetters(() => state)

      const connector = getters.getActiveConnector(Platform.EVM)
      expect(connector).toEqual(state.localConnector)
    })
  })

  describe('getActiveWallet', () => {
    it('should return wallet when session exists', () => {
      const state = createMockState()
      const getters = createAccountsStoreGetters(() => state)

      const wallet = getters.getActiveWallet()
      expect(wallet).toEqual(state.wallets.stored_mnemonic_wallet)
    })

    it('should return undefined when no session exists', () => {
      const state = createMockState({
        localConnector: {
          id: 'local_connector',
          access: AccessPattern.Native,
          status: ConnectorStatus.Disconnected,
          session: undefined,
        },
      })
      const getters = createAccountsStoreGetters(() => state)

      const wallet = getters.getActiveWallet()
      expect(wallet).toBeUndefined()
    })

    it('should return undefined when wallet ID not found', () => {
      const state = createMockState({
        localConnector: {
          id: 'local_connector',
          access: AccessPattern.Native,
          status: ConnectorStatus.Connected,
          session: {
            walletId: 'nonexistent_wallet',
            currentAccountIndex: 0,
            chainScope: {
              type: ChainScopeType.MultiChain,
              supportedChains: 'all',
            },
          },
        },
      })
      const getters = createAccountsStoreGetters(() => state)

      const wallet = getters.getActiveWallet()
      expect(wallet).toBeUndefined()
    })
  })

  describe('getActiveAddress', () => {
    it('should return address for EVM platform when wallet and session exist', () => {
      const state = createMockState()
      const getters = createAccountsStoreGetters(() => state)

      const address = getters.getActiveAddress(Platform.EVM)
      expect(address).toBe('0x1234567890123456789012345678901234567890')
    })

    it('should return address for different account index', () => {
      const state = createMockState({
        localConnector: {
          id: 'local_connector',
          access: AccessPattern.Native,
          status: ConnectorStatus.Connected,
          session: {
            walletId: 'stored_mnemonic_wallet',
            currentAccountIndex: 1,
            chainScope: {
              type: ChainScopeType.MultiChain,
              supportedChains: 'all',
            },
          },
        },
      })
      const getters = createAccountsStoreGetters(() => state)

      const address = getters.getActiveAddress(Platform.EVM)
      expect(address).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    })

    it('should return undefined for SVM platform (not implemented)', () => {
      const state = createMockState()
      const getters = createAccountsStoreGetters(() => state)

      const address = getters.getActiveAddress(Platform.SVM)
      expect(address).toBeUndefined()
    })

    it('should return undefined when no wallet exists', () => {
      const state = createMockState({
        localConnector: {
          id: 'local_connector',
          access: AccessPattern.Native,
          status: ConnectorStatus.Disconnected,
          session: undefined,
        },
      })
      const getters = createAccountsStoreGetters(() => state)

      const address = getters.getActiveAddress(Platform.EVM)
      expect(address).toBeUndefined()
    })

    it('should return undefined when account index is out of bounds', () => {
      const state = createMockState({
        localConnector: {
          id: 'local_connector',
          access: AccessPattern.Native,
          status: ConnectorStatus.Connected,
          session: {
            walletId: 'stored_mnemonic_wallet',
            currentAccountIndex: 999, // Out of bounds
            chainScope: {
              type: ChainScopeType.MultiChain,
              supportedChains: 'all',
            },
          },
        },
      })
      const getters = createAccountsStoreGetters(() => state)

      const address = getters.getActiveAddress(Platform.EVM)
      expect(address).toBeUndefined()
    })
  })

  describe('getActiveAddresses', () => {
    it('should return addresses for all platforms', () => {
      const state = createMockState()
      const getters = createAccountsStoreGetters(() => state)

      const addresses = getters.getActiveAddresses()
      expect(addresses).toEqual({
        evmAddress: '0x1234567890123456789012345678901234567890',
        svmAddress: undefined, // Not implemented
      })
    })

    it('should return undefined addresses when no active wallet', () => {
      const state = createMockState({
        localConnector: {
          id: 'local_connector',
          access: AccessPattern.Native,
          status: ConnectorStatus.Disconnected,
          session: undefined,
        },
      })
      const getters = createAccountsStoreGetters(() => state)

      const addresses = getters.getActiveAddresses()
      expect(addresses).toEqual({
        evmAddress: undefined,
        svmAddress: undefined,
      })
    })
  })

  describe('getActiveAccount', () => {
    it('should return account for EVM platform when address exists', () => {
      const state = createMockState()
      const getters = createAccountsStoreGetters(() => state)

      const account = getters.getActiveAccount(Platform.EVM)
      expect(account).toEqual({
        walletId: 'stored_mnemonic_wallet',
        address: '0x1234567890123456789012345678901234567890',
        platform: Platform.EVM,
      })
    })

    it('should return undefined for SVM platform (not implemented)', () => {
      const state = createMockState()
      const getters = createAccountsStoreGetters(() => state)

      const account = getters.getActiveAccount(Platform.SVM)
      expect(account).toBeUndefined()
    })

    it('should return undefined when no address exists', () => {
      const state = createMockState({
        localConnector: {
          id: 'local_connector',
          access: AccessPattern.Native,
          status: ConnectorStatus.Disconnected,
          session: undefined,
        },
      })
      const getters = createAccountsStoreGetters(() => state)

      const account = getters.getActiveAccount(Platform.EVM)
      expect(account).toBeUndefined()
    })

    it('should return undefined when account not found in state', () => {
      const state = createMockState({
        accounts: {}, // No accounts
      })
      const getters = createAccountsStoreGetters(() => state)

      const account = getters.getActiveAccount(Platform.EVM)
      expect(account).toBeUndefined()
    })
  })

  describe('getConnectionStatus', () => {
    it('should return connector status', () => {
      const state = createMockState()
      const getters = createAccountsStoreGetters(() => state)

      const status = getters.getConnectionStatus(Platform.EVM)
      expect(status).toMatchObject({
        status: ConnectorStatus.Connected,
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
      })
    })

    it('should return disconnected status when connector is disconnected', () => {
      const state = createMockState({
        localConnector: {
          id: 'local_connector',
          access: AccessPattern.Native,
          status: ConnectorStatus.Disconnected,
          session: undefined,
        },
      })
      const getters = createAccountsStoreGetters(() => state)

      const status = getters.getConnectionStatus(Platform.EVM)
      expect(status).toMatchObject({
        status: ConnectorStatus.Disconnected,
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty state gracefully', () => {
      const state = createMockState({
        wallets: {},
        accounts: {},
        localConnector: {
          id: 'local_connector',
          access: AccessPattern.Native,
          status: ConnectorStatus.Disconnected,
          session: undefined,
        },
      })
      const getters = createAccountsStoreGetters(() => state)

      expect(getters.getActiveWallet()).toBeUndefined()
      expect(getters.getActiveAddress(Platform.EVM)).toBeUndefined()
      expect(getters.getActiveAccount(Platform.EVM)).toBeUndefined()
      expect(getters.getConnectionStatus(Platform.EVM)).toMatchObject({
        status: ConnectorStatus.Disconnected,
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
      })
    })

    it('should handle readonly wallet correctly', () => {
      const state = createMockState({
        localConnector: {
          id: 'local_connector',
          access: AccessPattern.Native,
          status: ConnectorStatus.Connected,
          session: {
            walletId: 'readonly_import_wallet',
            currentAccountIndex: 0,
            chainScope: {
              type: ChainScopeType.MultiChain,
              supportedChains: 'all',
            },
          },
        },
      })
      const getters = createAccountsStoreGetters(() => state)

      const wallet = getters.getActiveWallet()
      expect(wallet?.signingCapability).toBe(SigningCapability.None)
      expect(wallet?.name).toBe('Readonly Wallet')

      const address = getters.getActiveAddress(Platform.EVM)
      expect(address).toBe('0x9999999999999999999999999999999999999999')
    })
  })
})
