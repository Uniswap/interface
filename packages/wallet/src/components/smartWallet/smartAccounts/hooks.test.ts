import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures'
import {
  SmartWalletDelegationAction,
  useSmartWalletDelegationStatus,
} from 'wallet/src/components/smartWallet/smartAccounts/hooks'
import type { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'
import { useSmartWalletChains } from 'wallet/src/features/smartWallet/hooks/useSmartWalletChains'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import { useActiveAccount, useHasSmartWalletConsent, useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { ACCOUNT, readOnlyAccount, signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { renderHook, waitFor } from 'wallet/src/test/test-utils'

jest.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccount: jest.fn(),
  useSignerAccounts: jest.fn(),
  useHasSmartWalletConsent: jest.fn(),
}))

jest.mock('wallet/src/features/smartWallet/hooks/useSmartWalletChains', () => ({
  useSmartWalletChains: jest.fn(),
}))

jest.mock('wallet/src/features/smartWallet/WalletDelegationProvider', () => ({
  useWalletDelegationContext: jest.fn(),
}))

const mockUseActiveAccount = useActiveAccount as jest.MockedFunction<typeof useActiveAccount>
const mockUseSignerAccounts = useSignerAccounts as jest.MockedFunction<typeof useSignerAccounts>
const mockUseHasSmartWalletConsent = useHasSmartWalletConsent as jest.MockedFunction<typeof useHasSmartWalletConsent>
const mockUseSmartWalletChains = useSmartWalletChains as jest.MockedFunction<typeof useSmartWalletChains>
const mockUseWalletDelegationContext = useWalletDelegationContext as jest.MockedFunction<
  typeof useWalletDelegationContext
>

const READONLY_ACCOUNT = readOnlyAccount()
const SECOND_SIGNER = signerMnemonicAccount()

function delegation(overrides: Partial<DelegationCheckResult> = {}): DelegationCheckResult {
  return {
    needsDelegation: false,
    currentDelegationAddress: null,
    isWalletDelegatedToUniswap: false,
    ...overrides,
  }
}

function setupMocks({
  activeAccount = ACCOUNT as any,
  signerAccounts = [ACCOUNT] as any[],
  hasSmartWalletConsent = false,
  enabledChains = [UniverseChainId.Mainnet],
  getDelegationDetails = jest.fn().mockReturnValue(undefined),
}: {
  activeAccount?: any
  signerAccounts?: any[]
  hasSmartWalletConsent?: boolean
  enabledChains?: UniverseChainId[]
  getDelegationDetails?: jest.Mock
} = {}): { getDelegationDetails: jest.Mock } {
  mockUseActiveAccount.mockReturnValue(activeAccount)
  mockUseSignerAccounts.mockReturnValue(signerAccounts)
  mockUseHasSmartWalletConsent.mockReturnValue(hasSmartWalletConsent)
  mockUseSmartWalletChains.mockReturnValue(enabledChains)
  mockUseWalletDelegationContext.mockReturnValue({
    getDelegationDetails,
    refreshDelegationData: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
    delegationDataQuery: {} as any,
  })
  return { getDelegationDetails }
}

describe(useSmartWalletDelegationStatus, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns None with loading=false when there is no active account', () => {
    setupMocks({ activeAccount: null })

    const { result } = renderHook(() => useSmartWalletDelegationStatus())

    expect(result.current).toEqual({
      status: SmartWalletDelegationAction.None,
      loading: false,
    })
  })

  it('returns None with loading=false for a read-only account', () => {
    setupMocks({ activeAccount: READONLY_ACCOUNT })

    const { result } = renderHook(() => useSmartWalletDelegationStatus())

    expect(result.current).toEqual({
      status: SmartWalletDelegationAction.None,
      loading: false,
    })
  })

  it('returns PromptUpgrade when no delegations exist and no consent given', async () => {
    setupMocks()

    const { result } = renderHook(() => useSmartWalletDelegationStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe(SmartWalletDelegationAction.PromptUpgrade)
  })

  it('returns None when user has smart wallet consent', async () => {
    setupMocks({ hasSmartWalletConsent: true })

    const { result } = renderHook(() => useSmartWalletDelegationStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe(SmartWalletDelegationAction.None)
  })

  it('returns ShowConflict when a non-Uniswap delegation exists', async () => {
    setupMocks({
      getDelegationDetails: jest.fn().mockReturnValue(delegation({ currentDelegationAddress: '0xNonUniswapContract' })),
    })

    const { result } = renderHook(() => useSmartWalletDelegationStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe(SmartWalletDelegationAction.ShowConflict)
  })

  it('returns None when already delegated to Uniswap (even without consent)', async () => {
    setupMocks({
      getDelegationDetails: jest
        .fn()
        .mockReturnValue(
          delegation({ currentDelegationAddress: '0xUniswapContract', isWalletDelegatedToUniswap: true }),
        ),
    })

    const { result } = renderHook(() => useSmartWalletDelegationStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe(SmartWalletDelegationAction.None)
  })

  it('returns ShowConflict if any chain has a non-Uniswap delegation', async () => {
    const getDelegationDetails = jest.fn().mockImplementation((_address: string, chainId: UniverseChainId) => {
      if (chainId === UniverseChainId.Mainnet) {
        return delegation({ currentDelegationAddress: '0xUniswapContract', isWalletDelegatedToUniswap: true })
      }
      return delegation({ currentDelegationAddress: '0xOtherProtocol' })
    })

    setupMocks({
      enabledChains: [UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne],
      getDelegationDetails,
    })

    const { result } = renderHook(() => useSmartWalletDelegationStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe(SmartWalletDelegationAction.ShowConflict)
  })

  it('returns PromptUpgrade when no chains have any delegation', async () => {
    setupMocks({
      enabledChains: [UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne],
      getDelegationDetails: jest.fn().mockReturnValue(delegation()),
    })

    const { result } = renderHook(() => useSmartWalletDelegationStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe(SmartWalletDelegationAction.PromptUpgrade)
  })

  it('returns None when home screen nudge was dismissed', async () => {
    setupMocks()

    const { result } = renderHook(() => useSmartWalletDelegationStatus(), {
      preloadedState: {
        behaviorHistory: {
          smartWalletNudge: {
            [SAMPLE_SEED_ADDRESS_1]: { hasDismissedHomeScreenNudge: true },
          },
        },
      } as any,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe(SmartWalletDelegationAction.None)
  })

  it('returns None when all nudges are disabled for address', async () => {
    setupMocks()

    const { result } = renderHook(() => useSmartWalletDelegationStatus(), {
      preloadedState: {
        behaviorHistory: {
          smartWalletNudge: {
            [SAMPLE_SEED_ADDRESS_1]: { isAllSmartWalletNudgesDisabled: true },
          },
        },
      } as any,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe(SmartWalletDelegationAction.None)
  })

  it('uses overrideAddress to find account from signer accounts', async () => {
    setupMocks({
      activeAccount: ACCOUNT,
      signerAccounts: [ACCOUNT, SECOND_SIGNER] as any[],
    })

    const { result } = renderHook(() => useSmartWalletDelegationStatus({ overrideAddress: SECOND_SIGNER.address }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe(SmartWalletDelegationAction.PromptUpgrade)
  })

  it('returns None when overrideAddress does not match any signer account and active is non-signer', () => {
    setupMocks({
      activeAccount: READONLY_ACCOUNT,
      signerAccounts: [ACCOUNT] as any[],
    })

    const { result } = renderHook(() =>
      useSmartWalletDelegationStatus({ overrideAddress: '0xUnknownAddress0000000000000000000000000' }),
    )

    expect(result.current).toEqual({
      status: SmartWalletDelegationAction.None,
      loading: false,
    })
  })

  it('checks delegation details for each enabled chain', async () => {
    const chains = [UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne, UniverseChainId.Optimism]
    const { getDelegationDetails } = setupMocks({ enabledChains: chains })

    const { result } = renderHook(() => useSmartWalletDelegationStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getDelegationDetails).toHaveBeenCalledTimes(chains.length)
    expect(getDelegationDetails).toHaveBeenCalledWith(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Mainnet)
    expect(getDelegationDetails).toHaveBeenCalledWith(SAMPLE_SEED_ADDRESS_1, UniverseChainId.ArbitrumOne)
    expect(getDelegationDetails).toHaveBeenCalledWith(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Optimism)
  })

  it('returns PromptUpgrade when enabled chains list is empty', async () => {
    setupMocks({ enabledChains: [] })

    const { result } = renderHook(() => useSmartWalletDelegationStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.status).toBe(SmartWalletDelegationAction.PromptUpgrade)
  })
})
