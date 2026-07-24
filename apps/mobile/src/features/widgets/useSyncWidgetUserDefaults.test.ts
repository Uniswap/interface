import { setItem } from 'react-native-widgetkit'
import { useSyncWidgetUserDefaults } from 'src/features/widgets/useSyncWidgetUserDefaults'
import { act, renderHook } from 'src/test/test-utils'
import { getBuildVariant } from 'src/utils/version'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { initialWalletState, setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { ACCOUNT, ACCOUNT2 } from 'wallet/src/test/fixtures'

vi.mock('react-native-widgetkit', () => ({
  getItem: vi.fn().mockResolvedValue(null),
  setItem: vi.fn().mockResolvedValue(undefined),
  reloadAllTimelines: vi.fn(),
}))

const mockChains = vi.hoisted(() => [1, 10])

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(() => ({ chains: mockChains })),
}))

vi.mock('uniswap/src/features/language/hooks', () => ({
  useCurrentLanguageInfo: vi.fn(() => ({ locale: 'en-US' })),
}))

vi.mock('uniswap/src/features/fiatCurrency/hooks', () => ({
  useAppFiatCurrencyInfo: vi.fn(() => ({ code: 'USD' })),
}))

const ACCOUNTS_KEY = getBuildVariant() + '.widgets.accounts'
const CHAINS_KEY = getBuildVariant() + '.widgets.chains'
const I18N_KEY = getBuildVariant() + '.widgets.i18n'

const mockedSetItem = vi.mocked(setItem)

function writesTo(key: string): unknown[] {
  return mockedSetItem.mock.calls.filter(([k]) => k === key).map(([, value]) => JSON.parse(value))
}

function walletStateWith({
  accounts,
  activeAccountAddress,
}: {
  accounts: Record<string, unknown>
  activeAccountAddress: string | null
}): { wallet: typeof initialWalletState } {
  return {
    wallet: {
      ...initialWalletState,
      accounts: accounts as typeof initialWalletState.accounts,
      activeAccountAddress,
    },
  }
}

describe('useSyncWidgetUserDefaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes the accounts payload with activeAddress in the shape the widget decodes', () => {
    renderHook(() => useSyncWidgetUserDefaults(), {
      preloadedState: walletStateWith({
        accounts: { [SAMPLE_SEED_ADDRESS_1]: ACCOUNT },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    })

    expect(writesTo(ACCOUNTS_KEY)).toEqual([
      {
        accounts: [{ address: SAMPLE_SEED_ADDRESS_1, name: ACCOUNT.name, isSigner: true }],
        activeAddress: SAMPLE_SEED_ADDRESS_1,
      },
    ])
  })

  it('writes activeAddress as null when there is no active account', () => {
    renderHook(() => useSyncWidgetUserDefaults(), {
      preloadedState: walletStateWith({ accounts: {}, activeAccountAddress: null }),
    })

    expect(writesTo(ACCOUNTS_KEY)).toEqual([{ accounts: [], activeAddress: null }])
  })

  it('writes the chains payload as {chainId, name} pairs the widget decodes', () => {
    renderHook(() => useSyncWidgetUserDefaults(), {
      preloadedState: walletStateWith({
        accounts: { [SAMPLE_SEED_ADDRESS_1]: ACCOUNT },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    })

    expect(writesTo(CHAINS_KEY)).toEqual([
      {
        chains: [
          { chainId: 1, name: 'ETHEREUM' },
          { chainId: 10, name: 'OPTIMISM' },
        ],
      },
    ])
  })

  it('writes the i18n payload on mount', () => {
    renderHook(() => useSyncWidgetUserDefaults(), {
      preloadedState: walletStateWith({ accounts: {}, activeAccountAddress: null }),
    })

    expect(writesTo(I18N_KEY)).toEqual([{ locale: 'en-US', currency: 'USD' }])
  })

  it('rewrites only the accounts payload when the active account changes', () => {
    const { store } = renderHook(() => useSyncWidgetUserDefaults(), {
      preloadedState: walletStateWith({
        accounts: { [SAMPLE_SEED_ADDRESS_1]: ACCOUNT, [SAMPLE_SEED_ADDRESS_2]: ACCOUNT2 },
        activeAccountAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    })

    expect(writesTo(ACCOUNTS_KEY)).toHaveLength(1)
    expect(writesTo(CHAINS_KEY)).toHaveLength(1)

    act(() => {
      store.dispatch(setAccountAsActive(SAMPLE_SEED_ADDRESS_2))
    })

    const accountWrites = writesTo(ACCOUNTS_KEY)
    expect(accountWrites).toHaveLength(2)
    expect(accountWrites[1]).toMatchObject({ activeAddress: SAMPLE_SEED_ADDRESS_2 })
    expect(writesTo(CHAINS_KEY)).toHaveLength(1)
    expect(writesTo(I18N_KEY)).toHaveLength(1)
  })
})
