import { act } from '@testing-library/react-native'
import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags } from '@universe/gating'
import type { UniswapBehaviorHistoryState } from 'uniswap/src/features/behaviorHistory/slice'
import { initialUniswapBehaviorHistoryState } from 'uniswap/src/features/behaviorHistory/slice'
import { usePoolsBalanceCoachmarkVisibility } from 'uniswap/src/features/portfolio/PortfolioBalance/usePoolsBalanceCoachmarkVisibility'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/telemetry/send')

const { mockUseFeatureFlag, mockUsePortfolioBalancePart } = vi.hoisted(() => ({
  mockUseFeatureFlag: vi.fn(),
  mockUsePortfolioBalancePart: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
  // usePoolsBalanceCoachmarkVisibility reads the pools flag via the exposure-disabled variant.
  useFeatureFlagWithExposureLoggingDisabled: mockUseFeatureFlag,
}))

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioBalancePart: mockUsePortfolioBalancePart,
}))

const WALLET_A = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

/**
 * The initial redux state defaults `hasDismissedPoolsBalanceCoachmark` to `true` (so brand-new
 * users never see the coachmark). To exercise the "existing user" path, tests preload the slice
 * with the flag explicitly set to `false`.
 */
const asExistingUser = (overrides: Partial<UniswapBehaviorHistoryState> = {}) => ({
  uniswapBehaviorHistory: {
    ...initialUniswapBehaviorHistoryState,
    hasDismissedPoolsBalanceCoachmark: false,
    ...overrides,
  },
})

const mockSliceData = (balanceUSD: number | undefined) => {
  mockUsePortfolioBalancePart.mockReturnValue({
    data: balanceUSD === undefined ? undefined : { balanceUSD, percentChange: 0, absoluteChangeUSD: 0 },
    loading: false,
    networkStatus: 7,
    refetch: vi.fn(),
    error: undefined,
    dataUpdatedAt: 1710000000000,
  })
}

describe(usePoolsBalanceCoachmarkVisibility, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.PortfolioPoolsBalances)
    mockSliceData(100)
  })

  it('returns shouldShow=true for an existing user when flag is on, wallet has pool positions, and not dismissed', () => {
    const { result } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }), {
      preloadedState: asExistingUser(),
    })
    expect(result.current.shouldShow).toBe(true)
  })

  it('defaults to dismissed for brand-new users (no preloaded behavior history override)', () => {
    const { result } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }))
    expect(result.current.shouldShow).toBe(false)
  })

  it('returns shouldShow=false when the feature flag is off', () => {
    mockUseFeatureFlag.mockReturnValue(false)
    const { result } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }), {
      preloadedState: asExistingUser(),
    })
    expect(result.current.shouldShow).toBe(false)
  })

  it('returns shouldShow=false when no wallet address is provided', () => {
    const { result } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({}), {
      preloadedState: asExistingUser(),
    })
    expect(result.current.shouldShow).toBe(false)
  })

  it('returns shouldShow=false when the wallet has zero pool positions', () => {
    mockSliceData(0)
    const { result } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }), {
      preloadedState: asExistingUser(),
    })
    expect(result.current.shouldShow).toBe(false)
  })

  it('returns shouldShow=false while pool balance data is still loading', () => {
    mockSliceData(undefined)
    const { result } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }), {
      preloadedState: asExistingUser(),
    })
    expect(result.current.shouldShow).toBe(false)
  })

  it('returns shouldShow=false when the user has already dismissed', () => {
    const { result } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }), {
      preloadedState: asExistingUser({ hasDismissedPoolsBalanceCoachmark: true }),
    })
    expect(result.current.shouldShow).toBe(false)
  })

  it('still considers an svm-only wallet for showing the coachmark', () => {
    const { result } = renderHookWithProviders(
      () => usePoolsBalanceCoachmarkVisibility({ svmAddress: 'SVMaddress1111111111111111' }),
      { preloadedState: asExistingUser() },
    )
    expect(result.current.shouldShow).toBe(true)
  })

  it('reads from the cache without triggering a fetch (passes cacheOnly to the data hook)', () => {
    renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }), {
      preloadedState: asExistingUser(),
    })

    expect(mockUsePortfolioBalancePart).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheOnly: true,
      }),
    )
  })

  it('persists dismissal as a single per-user flag', () => {
    const { result, store } = renderHookWithProviders(
      () => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }),
      { preloadedState: asExistingUser() },
    )

    expect(result.current.shouldShow).toBe(true)

    act(() => {
      result.current.dismiss()
    })

    expect(store.getState().uniswapBehaviorHistory.hasDismissedPoolsBalanceCoachmark).toBe(true)
    expect(result.current.shouldShow).toBe(false)
  })

  it('fires the coachmark dismiss analytics event on dismiss', () => {
    const { result } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }), {
      preloadedState: asExistingUser(),
    })

    act(() => {
      result.current.dismiss()
    })

    expect(sendAnalyticsEvent as Mock).toHaveBeenCalledWith(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.PoolsBalanceCoachmark,
    })
  })
})
