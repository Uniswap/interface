import { useDatadogStatus } from 'src/features/datadog/DatadogContext'
import { useDatadogWalletContext } from 'src/features/datadog/useDatadogWalletContext'
import { act, renderHook } from 'src/test/test-utils'
import { AccountType } from 'uniswap/src/features/accounts/types'
import {
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
  SAMPLE_SEED_ADDRESS_3,
} from 'uniswap/src/test/fixtures/gql/assets/constants'
import { setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'
import { logger } from 'utilities/src/logger/logger'
import { initialTelemetryState } from 'wallet/src/features/telemetry/slice'
import { addAccount, initialWalletState, removeAccounts, setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { ACCOUNT, ACCOUNT2 } from 'wallet/src/test/fixtures'

vi.mock('src/features/datadog/DatadogContext', () => ({
  useDatadogStatus: vi.fn(() => ({ isInitialized: true, setInitialized: vi.fn() })),
}))

vi.mock('utilities/src/logger/datadog/Datadog', () => ({
  setAttributesToDatadog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn() },
}))

const mockUseDatadogStatus = vi.mocked(useDatadogStatus)
const mockSetAttributesToDatadog = vi.mocked(setAttributesToDatadog)
const mockLoggerError = vi.mocked(logger.error)

const VIEW_ONLY_ACCOUNT = {
  type: AccountType.Readonly as const,
  address: SAMPLE_SEED_ADDRESS_3,
  name: 'View Only',
  timeImportedMs: 1000,
  pushNotificationsEnabled: false,
}

const datadogReady = { isInitialized: true, setInitialized: vi.fn() }
const datadogPending = { isInitialized: false, setInitialized: vi.fn() }

function walletStateWith({
  accounts,
  activeAccountAddress,
  allowAnalytics = true,
}: {
  accounts: Record<string, unknown>
  activeAccountAddress: string | null
  allowAnalytics?: boolean
}): { wallet: typeof initialWalletState; telemetry: typeof initialTelemetryState } {
  return {
    wallet: {
      ...initialWalletState,
      accounts: accounts as any,
      activeAccountAddress,
    },
    telemetry: {
      ...initialTelemetryState,
      allowAnalytics,
    },
  }
}

describe('useDatadogWalletContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDatadogStatus.mockReturnValue(datadogReady)
    mockSetAttributesToDatadog.mockResolvedValue(undefined)
  })

  it('does not publish attributes while Datadog is not initialized', () => {
    mockUseDatadogStatus.mockReturnValue(datadogPending)

    renderHook(() => useDatadogWalletContext(), {
      preloadedState: walletStateWith({
        accounts: { [SAMPLE_SEED_ADDRESS_1]: ACCOUNT },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    })

    expect(mockSetAttributesToDatadog).not.toHaveBeenCalled()
  })

  it('does not publish attributes when the user has opted out of analytics', () => {
    renderHook(() => useDatadogWalletContext(), {
      preloadedState: walletStateWith({
        accounts: { [SAMPLE_SEED_ADDRESS_1]: ACCOUNT },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
        allowAnalytics: false,
      }),
    })

    expect(mockSetAttributesToDatadog).not.toHaveBeenCalled()
  })

  it('publishes once on mount with active address + signer addresses', () => {
    renderHook(() => useDatadogWalletContext(), {
      preloadedState: walletStateWith({
        accounts: { [SAMPLE_SEED_ADDRESS_1]: ACCOUNT },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    })

    expect(mockSetAttributesToDatadog).toHaveBeenCalledTimes(1)
    expect(mockSetAttributesToDatadog).toHaveBeenLastCalledWith({
      activeWalletAddress: SAMPLE_SEED_ADDRESS_1,
      signerWalletAddresses: [SAMPLE_SEED_ADDRESS_1],
      viewOnlyWalletAddresses: [],
      signerWalletCount: 1,
      viewOnlyWalletCount: 0,
    })
  })

  it('publishes null active address and empty arrays when no accounts exist', () => {
    renderHook(() => useDatadogWalletContext(), {
      preloadedState: walletStateWith({ accounts: {}, activeAccountAddress: null }),
    })

    expect(mockSetAttributesToDatadog).toHaveBeenCalledTimes(1)
    expect(mockSetAttributesToDatadog).toHaveBeenLastCalledWith({
      activeWalletAddress: null,
      signerWalletAddresses: [],
      viewOnlyWalletAddresses: [],
      signerWalletCount: 0,
      viewOnlyWalletCount: 0,
    })
  })

  it('classifies signer-mnemonic and view-only accounts into separate lists', () => {
    renderHook(() => useDatadogWalletContext(), {
      preloadedState: walletStateWith({
        accounts: {
          [SAMPLE_SEED_ADDRESS_1]: ACCOUNT,
          [SAMPLE_SEED_ADDRESS_3]: VIEW_ONLY_ACCOUNT,
        },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    })

    expect(mockSetAttributesToDatadog).toHaveBeenLastCalledWith({
      activeWalletAddress: SAMPLE_SEED_ADDRESS_1,
      signerWalletAddresses: [SAMPLE_SEED_ADDRESS_1],
      viewOnlyWalletAddresses: [SAMPLE_SEED_ADDRESS_3],
      signerWalletCount: 1,
      viewOnlyWalletCount: 1,
    })
  })

  it('republishes when the active wallet changes', () => {
    const { store } = renderHook(() => useDatadogWalletContext(), {
      preloadedState: walletStateWith({
        accounts: {
          [SAMPLE_SEED_ADDRESS_1]: ACCOUNT,
          [SAMPLE_SEED_ADDRESS_2]: ACCOUNT2,
        },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    })

    expect(mockSetAttributesToDatadog).toHaveBeenCalledTimes(1)

    act(() => {
      store.dispatch(setAccountAsActive(SAMPLE_SEED_ADDRESS_2))
    })

    expect(mockSetAttributesToDatadog).toHaveBeenCalledTimes(2)
    expect(mockSetAttributesToDatadog).toHaveBeenLastCalledWith(
      expect.objectContaining({ activeWalletAddress: SAMPLE_SEED_ADDRESS_2 }),
    )
  })

  it('republishes when a signer account is added', () => {
    const { store } = renderHook(() => useDatadogWalletContext(), {
      preloadedState: walletStateWith({
        accounts: { [SAMPLE_SEED_ADDRESS_1]: ACCOUNT },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    })

    act(() => {
      store.dispatch(addAccount(ACCOUNT2))
    })

    expect(mockSetAttributesToDatadog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        signerWalletAddresses: expect.arrayContaining([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]) as string[],
        signerWalletCount: 2,
        viewOnlyWalletCount: 0,
      }),
    )
  })

  it('republishes when a view-only account is added', () => {
    const { store } = renderHook(() => useDatadogWalletContext(), {
      preloadedState: walletStateWith({
        accounts: { [SAMPLE_SEED_ADDRESS_1]: ACCOUNT },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    })

    act(() => {
      store.dispatch(addAccount(VIEW_ONLY_ACCOUNT))
    })

    expect(mockSetAttributesToDatadog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        signerWalletAddresses: [SAMPLE_SEED_ADDRESS_1],
        viewOnlyWalletAddresses: [SAMPLE_SEED_ADDRESS_3],
        signerWalletCount: 1,
        viewOnlyWalletCount: 1,
      }),
    )
  })

  it('republishes when an account is removed', () => {
    const { store } = renderHook(() => useDatadogWalletContext(), {
      preloadedState: walletStateWith({
        accounts: {
          [SAMPLE_SEED_ADDRESS_1]: ACCOUNT,
          [SAMPLE_SEED_ADDRESS_2]: ACCOUNT2,
        },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_2,
      }),
    })

    act(() => {
      store.dispatch(removeAccounts([SAMPLE_SEED_ADDRESS_2]))
    })

    expect(mockSetAttributesToDatadog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        // removeAccounts resets the active wallet to the first remaining when the active one was deleted
        activeWalletAddress: SAMPLE_SEED_ADDRESS_1,
        signerWalletAddresses: [SAMPLE_SEED_ADDRESS_1],
        signerWalletCount: 1,
      }),
    )
  })

  it('logs an error and does not throw when setAttributesToDatadog rejects', async () => {
    mockSetAttributesToDatadog.mockRejectedValueOnce(new Error('dd network failure'))

    renderHook(() => useDatadogWalletContext(), {
      preloadedState: walletStateWith({
        accounts: { [SAMPLE_SEED_ADDRESS_1]: ACCOUNT },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    })

    // Flush the rejected microtask so the .catch handler runs.
    await act(async () => {
      await Promise.resolve()
    })

    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    expect(mockLoggerError.mock.calls[0]?.[0]).toBeInstanceOf(Error)
    expect(mockLoggerError.mock.calls[0]?.[1]).toMatchObject({
      tags: { file: 'useDatadogWalletContext.tsx' },
    })
  })
})
