import { act } from '@testing-library/react-native'
import { SharedEventName } from '@uniswap/analytics-events'
import type { UniswapBehaviorHistoryState } from 'uniswap/src/features/behaviorHistory/slice'
import { initialUniswapBehaviorHistoryState } from 'uniswap/src/features/behaviorHistory/slice'
import { usePoolsBalanceCoachmarkVisibility } from 'uniswap/src/features/portfolio/PortfolioBalance/usePoolsBalanceCoachmarkVisibility'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/telemetry/send')

const { mockUsePortfolioBalancePart } = vi.hoisted(() => ({
  mockUsePortfolioBalancePart: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioBalancePart: mockUsePortfolioBalancePart,
}))

const WALLET_A = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

/**
 * `hasDismissedPoolsBalanceCoachmark` is a tri-state: `undefined` = state created after launch,
 * `false` = eligible, `true` = dismissed. Only exactly `false` can ever show the coachmark.
 */
const withCoachmarkState = (hasDismissedPoolsBalanceCoachmark: boolean | undefined) => ({
  uniswapBehaviorHistory: {
    ...initialUniswapBehaviorHistoryState,
    hasDismissedPoolsBalanceCoachmark,
  } satisfies UniswapBehaviorHistoryState,
})

const asEligibleUser = () => withCoachmarkState(false)

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
    mockSliceData(100)
  })

  it('returns shouldShow=true for an eligible user whose wallet has pool positions', () => {
    const { result } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }), {
      preloadedState: asEligibleUser(),
    })
    expect(result.current.shouldShow).toBe(true)
  })

  it('never shows for post-launch state, and does not auto-dismiss it', () => {
    mockSliceData(0)
    const { result, store } = renderHookWithProviders(
      () => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }),
      { preloadedState: withCoachmarkState(undefined) },
    )
    expect(result.current.shouldShow).toBe(false)
    expect(store.getState().uniswapBehaviorHistory.hasDismissedPoolsBalanceCoachmark).toBeUndefined()
  })

  it('returns shouldShow=false when no wallet address is provided, without auto-dismissing', () => {
    mockSliceData(0)
    const { result, store } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({}), {
      preloadedState: asEligibleUser(),
    })
    expect(result.current.shouldShow).toBe(false)
    expect(store.getState().uniswapBehaviorHistory.hasDismissedPoolsBalanceCoachmark).toBe(false)
  })

  it('permanently dismisses a wallet evaluated with zero pool positions, even if pools appear later', () => {
    mockSliceData(0)
    const { result, store, rerender } = renderHookWithProviders(
      () => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }),
      { preloadedState: asEligibleUser() },
    )
    expect(result.current.shouldShow).toBe(false)
    expect(store.getState().uniswapBehaviorHistory.hasDismissedPoolsBalanceCoachmark).toBe(true)

    mockSliceData(100)
    rerender()
    expect(result.current.shouldShow).toBe(false)
  })

  it('does not auto-dismiss while pool balance data is still loading', () => {
    mockSliceData(undefined)
    const { result, store } = renderHookWithProviders(
      () => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }),
      { preloadedState: asEligibleUser() },
    )
    expect(result.current.shouldShow).toBe(false)
    expect(store.getState().uniswapBehaviorHistory.hasDismissedPoolsBalanceCoachmark).toBe(false)
  })

  it('returns shouldShow=false when the user has already dismissed', () => {
    const { result } = renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }), {
      preloadedState: withCoachmarkState(true),
    })
    expect(result.current.shouldShow).toBe(false)
  })

  it('still considers an svm-only wallet for showing the coachmark', () => {
    const { result } = renderHookWithProviders(
      () => usePoolsBalanceCoachmarkVisibility({ svmAddress: 'SVMaddress1111111111111111' }),
      { preloadedState: asEligibleUser() },
    )
    expect(result.current.shouldShow).toBe(true)
  })

  it('reads from the cache without triggering a fetch (passes cacheOnly to the data hook)', () => {
    renderHookWithProviders(() => usePoolsBalanceCoachmarkVisibility({ evmAddress: WALLET_A }), {
      preloadedState: asEligibleUser(),
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
      { preloadedState: asEligibleUser() },
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
      preloadedState: asEligibleUser(),
    })

    act(() => {
      result.current.dismiss()
    })

    expect(sendAnalyticsEvent as Mock).toHaveBeenCalledWith(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.PoolsBalanceCoachmark,
    })
  })
})
