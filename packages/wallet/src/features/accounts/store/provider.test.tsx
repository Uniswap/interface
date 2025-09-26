import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { AccountsStore } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { AccessPattern, ConnectorErrorType, ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { ChainScopeType } from 'uniswap/src/features/accounts/store/types/Session'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { AccountType as ReduxAccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { AccountsStoreContextProvider, useAccountsStoreContext } from 'wallet/src/features/accounts/store/provider'
import {
  Account as ReduxAccount,
  SignerMnemonicAccount as ReduxSignerMnemonicAccount,
} from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount as useActiveReduxAccount } from 'wallet/src/features/wallet/hooks'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'
import { WalletSliceState } from 'wallet/src/features/wallet/slice'
import { WalletState } from 'wallet/src/state/walletReducer'
import { RenderHookResult, renderHook } from 'wallet/src/test/test-utils'

// Don't mock the getters - use the real implementation

// Mock the active account hook
jest.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccount: jest.fn(),
}))

// Mock the onboarding selector
jest.mock('wallet/src/features/wallet/selectors', () => ({
  selectFinishedOnboarding: jest.fn(),
}))

const mockUseActiveReduxAccount = useActiveReduxAccount as jest.MockedFunction<typeof useActiveReduxAccount>
const mockSelectFinishedOnboarding = selectFinishedOnboarding as jest.MockedFunction<typeof selectFinishedOnboarding>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createTestStore = (walletState: Partial<WalletState['wallet']> = {}) => {
  return configureStore({
    reducer: {
      wallet: (
        state = {
          accounts: {},
          activeAccountAddress: null,
          finishedOnboarding: false,
          androidCloudBackupEmail: null,
        } as WalletSliceState,
      ) => state,
    },
    preloadedState: {
      wallet: {
        accounts: {},
        activeAccountAddress: null,
        finishedOnboarding: false,
        androidCloudBackupEmail: null,
        ...walletState,
      },
    },
  })
}

const createMnemonicAccount = (overrides: Partial<ReduxSignerMnemonicAccount> = {}): ReduxSignerMnemonicAccount => ({
  type: ReduxAccountType.SignerMnemonic,
  address: '0x1234567890123456789012345678901234567890',
  derivationIndex: 0,
  mnemonicId: 'test-mnemonic-id',
  name: 'Test Account',
  timeImportedMs: Date.now(),
  pushNotificationsEnabled: false,
  ...overrides,
})

const createReadonlyAccount = (overrides: Partial<ReduxAccount> = {}): ReduxAccount =>
  ({
    type: ReduxAccountType.Readonly,
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    name: 'Readonly Account',
    timeImportedMs: Date.now(),
    pushNotificationsEnabled: false,
    ...overrides,
  }) as ReduxAccount

const renderWithProvider = (
  walletState: Partial<WalletState['wallet']> = {},
): RenderHookResult<AccountsStore, void> => {
  const store = createTestStore(walletState)

  const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
    <Provider store={store}>
      <AccountsStoreContextProvider>{children}</AccountsStoreContextProvider>
    </Provider>
  )

  return renderHook(() => useAccountsStoreContext(), { wrapper })
}

describe('Wallet Accounts Store Provider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when no active account', () => {
    it('should create disconnected connector when onboarding not finished', () => {
      mockUseActiveReduxAccount.mockReturnValue(null)
      mockSelectFinishedOnboarding.mockReturnValue(false)

      const { result } = renderWithProvider()

      const connector = result.current.getState().getActiveConnector(Platform.EVM)
      expect(connector).toEqual({
        id: 'local_connector',
        access: AccessPattern.Native,
        status: ConnectorStatus.Disconnected,
        session: undefined,
        error: ConnectorErrorType.OnboardingNotFinished,
      })
    })

    it('should create disconnected connector when onboarding finished but no account', () => {
      mockUseActiveReduxAccount.mockReturnValue(null)
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider()

      const connector = result.current.getState().getActiveConnector(Platform.EVM)
      expect(connector).toEqual({
        id: 'local_connector',
        access: AccessPattern.Native,
        status: ConnectorStatus.Disconnected,
        session: undefined,
        error: ConnectorErrorType.UnexpectedEmptyAccountState,
      })
    })
  })

  describe('when active mnemonic account exists', () => {
    it('should create connected connector with session', () => {
      const mnemonicAccount = createMnemonicAccount({ derivationIndex: 2 })
      mockUseActiveReduxAccount.mockReturnValue(mnemonicAccount)
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider({
        accounts: {
          [mnemonicAccount.address]: mnemonicAccount,
        },
      })

      const connector = result.current.getState().getActiveConnector(Platform.EVM)
      expect(connector).toEqual({
        id: 'local_connector',
        access: AccessPattern.Native,
        status: ConnectorStatus.Connected,
        session: {
          walletId: 'stored_mnemonic_wallet',
          currentAccountIndex: 2,
          chainScope: {
            type: ChainScopeType.MultiChain,
            supportedChains: 'all',
          },
        },
      })
    })

    it('should create mnemonic wallet with immediate signing capability', () => {
      const mnemonicAccount = createMnemonicAccount()
      mockUseActiveReduxAccount.mockReturnValue(mnemonicAccount)
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider({
        accounts: {
          [mnemonicAccount.address]: mnemonicAccount,
        },
      })

      const wallet = result.current.getState().getActiveWallet(Platform.EVM)
      expect(wallet).toEqual({
        id: 'stored_mnemonic_wallet',
        addresses: [
          {
            derivationIndex: 0,
            evm: '0x1234567890123456789012345678901234567890',
          },
        ],
        signingCapability: SigningCapability.Immediate,
      })
    })

    it('should create account with correct wallet ID mapping', () => {
      const mnemonicAccount = createMnemonicAccount()
      mockUseActiveReduxAccount.mockReturnValue(mnemonicAccount)
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider({
        accounts: {
          [mnemonicAccount.address]: mnemonicAccount,
        },
      })

      const account = result.current.getState().getActiveAccount(Platform.EVM)
      expect(account).toEqual({
        walletId: 'stored_mnemonic_wallet',
        address: '0x1234567890123456789012345678901234567890',
        platform: Platform.EVM,
      })
    })
  })

  describe('when active readonly account exists', () => {
    it('should create connected connector with session for readonly account', () => {
      const readonlyAccount = createReadonlyAccount()
      mockUseActiveReduxAccount.mockReturnValue(readonlyAccount)
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider({
        accounts: {
          [readonlyAccount.address]: readonlyAccount,
        },
      })

      const connector = result.current.getState().getActiveConnector(Platform.EVM)
      expect(connector).toEqual({
        id: 'local_connector',
        access: AccessPattern.Native,
        status: ConnectorStatus.Connected,
        session: {
          walletId: 'readonly_import_wallet-0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          currentAccountIndex: 0, // Re"readonly_import_wallet-0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"adonly accounts always use index 0
          chainScope: {
            type: ChainScopeType.MultiChain,
            supportedChains: 'all',
          },
        },
      })
    })

    it('should create readonly wallet with no signing capability', () => {
      const readonlyAccount = createReadonlyAccount()
      mockUseActiveReduxAccount.mockReturnValue(readonlyAccount)
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider({
        accounts: {
          [readonlyAccount.address]: readonlyAccount,
        },
      })

      const wallet = result.current.getState().getActiveWallet(Platform.EVM)
      expect(wallet).toEqual({
        id: 'readonly_import_wallet-0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        addresses: [
          {
            evm: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
        ],
        signingCapability: SigningCapability.None,
        name: 'Readonly Account',
      })
    })

    it('should create account with readonly wallet ID', () => {
      const readonlyAccount = createReadonlyAccount()
      mockUseActiveReduxAccount.mockReturnValue(readonlyAccount)
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider({
        accounts: {
          [readonlyAccount.address]: readonlyAccount,
        },
      })

      const account = result.current.getState().getActiveAccount(Platform.EVM)
      expect(account).toEqual({
        walletId: 'readonly_import_wallet-0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        platform: Platform.EVM,
      })
    })
  })

  describe('when multiple accounts exist', () => {
    it('should handle multiple mnemonic accounts with different derivation indices', () => {
      const account1 = createMnemonicAccount({
        derivationIndex: 0,
        address: '0x1111111111111111111111111111111111111111',
      })
      const account2 = createMnemonicAccount({
        derivationIndex: 2,
        address: '0x2222222222222222222222222222222222222222',
      })
      const account3 = createMnemonicAccount({
        derivationIndex: 5,
        address: '0x3333333333333333333333333333333333333333',
      })

      mockUseActiveReduxAccount.mockReturnValue(account2) // Active account is index 2
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider({
        accounts: {
          [account1.address]: account1,
          [account2.address]: account2,
          [account3.address]: account3,
        },
      })

      const wallet = result.current.getState().getActiveWallet(Platform.EVM)
      expect(wallet?.addresses).toHaveLength(6) // Array length should accommodate highest index + 1
      expect(wallet?.addresses[0]?.evm).toBe('0x1111111111111111111111111111111111111111')
      expect(wallet?.addresses[2]?.evm).toBe('0x2222222222222222222222222222222222222222')
      expect(wallet?.addresses[5]?.evm).toBe('0x3333333333333333333333333333333333333333')
    })

    it('should handle mixed mnemonic and readonly accounts', () => {
      const mnemonicAccount = createMnemonicAccount()
      const readonlyAccount = createReadonlyAccount()

      mockUseActiveReduxAccount.mockReturnValue(mnemonicAccount)
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider({
        accounts: {
          [mnemonicAccount.address]: mnemonicAccount,
          [readonlyAccount.address]: readonlyAccount,
        },
      })

      // Should have both wallets
      const wallets = result.current.getState().wallets
      expect(Object.keys(wallets)).toHaveLength(2)
      expect(wallets.stored_mnemonic_wallet).toBeDefined()
      expect(wallets['readonly_import_wallet-0xabcdefabcdefabcdefabcdefabcdefabcdefabcd']).toBeDefined()
    })
  })

  describe('SVM platform support', () => {
    it('should return undefined for SVM connector (not implemented)', () => {
      const mnemonicAccount = createMnemonicAccount()
      mockUseActiveReduxAccount.mockReturnValue(mnemonicAccount)
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider({
        accounts: {
          [mnemonicAccount.address]: mnemonicAccount,
        },
      })

      const connector = result.current.getState().getActiveConnector(Platform.SVM)
      expect(connector).toBeUndefined()
    })
  })
})
