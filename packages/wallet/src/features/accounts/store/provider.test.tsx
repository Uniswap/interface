import { configureStore } from '@reduxjs/toolkit'
import { useFeatureFlag } from '@universe/gating'
import { Provider } from 'react-redux'
import { AccountsStore } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { AccessPattern, ConnectorErrorType, ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { ChainScopeType } from 'uniswap/src/features/accounts/store/types/Session'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { AccountType as ReduxAccountType } from 'uniswap/src/features/accounts/types'
import { CAIP25Session } from 'uniswap/src/features/capabilities/caip25/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import type { MockedFunction } from 'vitest'
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
vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccount: vi.fn(),
}))

// Mock the onboarding selector
vi.mock('wallet/src/features/wallet/selectors', () => ({
  selectFinishedOnboarding: vi.fn(),
}))

// Mock the enabled chains hook
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(() => ({
    chains: [1, 10, 137, 8453, 42161], // Default mainnet chains
  })),
}))

// Mock the swap delegation provider. Default: no delegation; individual tests override per chain.
const mockGetSwapDelegationInfo = vi.fn(
  (_chainId?: number): SwapDelegationInfo => ({
    delegationInclusion: false,
    delegationAddress: undefined,
  }),
)
vi.mock('wallet/src/features/smartWallet/WalletDelegationProvider', () => ({
  useGetSwapDelegationInfoForActiveAccount: () => mockGetSwapDelegationInfo,
  useWalletDelegationContext: () => ({
    delegationDataQuery: { data: undefined },
    getDelegationDetails: () => undefined,
    refreshDelegationData: async () => {},
    isLoading: false,
  }),
}))

// Mock the gas sponsorship feature flag (defaults to off in beforeEach)
vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  useFeatureFlag: vi.fn(),
}))

const mockUseActiveReduxAccount = useActiveReduxAccount as MockedFunction<typeof useActiveReduxAccount>
const mockSelectFinishedOnboarding = selectFinishedOnboarding as MockedFunction<typeof selectFinishedOnboarding>
const mockUseFeatureFlag = useFeatureFlag as MockedFunction<typeof useFeatureFlag>

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
    vi.clearAllMocks()
    mockUseFeatureFlag.mockReturnValue(false)
    mockGetSwapDelegationInfo.mockReturnValue({ delegationInclusion: false, delegationAddress: undefined })
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
          caip25Info: expect.objectContaining({
            scopes: expect.any(Object),
            properties: expect.any(Object),
          }),
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
          currentAccountIndex: 0, // Readonly accounts always use index 0
          chainScope: {
            type: ChainScopeType.MultiChain,
            supportedChains: 'all',
          },
          caip25Info: expect.objectContaining({
            scopes: expect.any(Object),
            properties: expect.any(Object),
          }),
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
      expect(wallets['stored_mnemonic_wallet']).toBeDefined()
      expect(wallets['readonly_import_wallet-0xabcdefabcdefabcdefabcdefabcdefabcdefabcd']).toBeDefined()
    })
  })

  describe('CAIP-25 session paymaster capability', () => {
    const DELEGATION_ADDRESS = '0xdelegatedelegatedelegatedelegatedelegate'

    const getCaip25Info = (): CAIP25Session => {
      const mnemonicAccount = createMnemonicAccount()
      mockUseActiveReduxAccount.mockReturnValue(mnemonicAccount)
      mockSelectFinishedOnboarding.mockReturnValue(true)

      const { result } = renderWithProvider({
        accounts: { [mnemonicAccount.address]: mnemonicAccount },
      })

      const connector = result.current.getState().getActiveConnector(Platform.EVM)
      return connector?.session?.caip25Info as CAIP25Session
    }

    it('advertises atomic (ready) and paymasterService for a chain pending delegation when sponsorship is enabled', () => {
      mockUseFeatureFlag.mockReturnValue(true)
      mockGetSwapDelegationInfo.mockImplementation((chainId?: number) =>
        chainId === 1
          ? { delegationInclusion: true, delegationAddress: DELEGATION_ADDRESS, isWalletDelegatedToUniswap: false }
          : { delegationInclusion: false, delegationAddress: undefined },
      )

      const caip25Info = getCaip25Info()
      const chainScope = caip25Info.scopes['eip155:1']

      expect(chainScope?.capabilities).toEqual({
        atomic: { status: 'ready' },
        paymasterService: { supported: true },
      })
      expect(chainScope?.methods).toContain('wallet_sendCalls')
      expect(chainScope?.clientContext?.nextEvmUpgradeAddress).toBe(DELEGATION_ADDRESS)
      // Promoted chain is removed from the multi-chain default scope.
      expect(caip25Info.scopes.eip155?.chains).not.toContain('1')
    })

    it('advertises atomic (supported) without an upgrade address for an already-delegated chain', () => {
      mockUseFeatureFlag.mockReturnValue(true)
      mockGetSwapDelegationInfo.mockImplementation((chainId?: number) =>
        chainId === 1
          ? { delegationInclusion: false, delegationAddress: undefined, isWalletDelegatedToUniswap: true }
          : { delegationInclusion: false, delegationAddress: undefined },
      )

      const caip25Info = getCaip25Info()
      const chainScope = caip25Info.scopes['eip155:1']

      expect(chainScope?.capabilities).toEqual({
        atomic: { status: 'supported' },
        paymasterService: { supported: true },
      })
      expect(chainScope?.clientContext?.nextEvmUpgradeAddress).toBeUndefined()
    })

    it('still advertises atomic but omits paymasterService when sponsorship flag is disabled', () => {
      mockUseFeatureFlag.mockReturnValue(false)
      mockGetSwapDelegationInfo.mockImplementation((chainId?: number) =>
        chainId === 1
          ? { delegationInclusion: true, delegationAddress: DELEGATION_ADDRESS, isWalletDelegatedToUniswap: false }
          : { delegationInclusion: false, delegationAddress: undefined },
      )

      const caip25Info = getCaip25Info()
      const chainScope = caip25Info.scopes['eip155:1']

      // atomic is always mirrored; only paymasterService is gated by the sponsorship flag.
      expect(chainScope?.capabilities).toEqual({ atomic: { status: 'ready' } })
      expect(chainScope?.clientContext?.nextEvmUpgradeAddress).toBe(DELEGATION_ADDRESS)
    })

    it('keeps a non-eligible chain in the default multi-chain scope', () => {
      mockUseFeatureFlag.mockReturnValue(true)
      // No delegation and not delegated -> not eligible on any chain.

      const caip25Info = getCaip25Info()

      expect(caip25Info.scopes['eip155:1']).toBeUndefined()
      expect(caip25Info.scopes.eip155?.chains).toContain('1')
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
