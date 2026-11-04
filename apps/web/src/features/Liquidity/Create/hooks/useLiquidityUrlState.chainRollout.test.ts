import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag, useStatsigClientStatus } from '@universe/gating'
import { useQueryState, useQueryStates } from 'nuqs'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'
import { vi } from 'vitest'
import {
  CHAIN_ROLLOUT_READINESS_TIMEOUT_MS,
  useLiquidityUrlState,
} from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import { DEFAULT_FEE_DATA, PositionFlowStep } from '~/features/Liquidity/Create/types'
import { useCurrencyWithLoading } from '~/hooks/currency/useCurrencyWithLoading'
import { mocked } from '~/test-utils/mocked'
import { act, renderHook } from '~/test-utils/render'

vi.mock('nuqs', async () => {
  const actual = await vi.importActual('nuqs')
  return {
    ...actual,
    useQueryState: vi.fn(),
    useQueryStates: vi.fn(),
  }
})

vi.mock('~/hooks/currency/useCurrencyWithLoading', () => ({ useCurrencyWithLoading: vi.fn() }))

// Drives testnet mode without touching `setIsTestnetModeEnabled`, whose usages are deliberately vetted.
// `useEnabledChains` reads this selector, so mocking it moves both the enabled-chain set and the
// `isTestnetModeEnabled` flag together, exactly as the real toggle would.
vi.mock('uniswap/src/features/settings/selectors', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    selectIsTestnetModeEnabled: vi.fn(() => false),
  }
})

// Overrides the global `@universe/gating` mock from setupTests, which hardcodes `isStatsigReady: true`.
// This suite needs to drive Statsig readiness and the chain rollout flags per test.
vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlag: vi.fn(),
    useFeatureFlagWithLoading: vi.fn(),
    useFeatureFlagWithExposureLoggingDisabled: vi.fn(),
    getFeatureFlag: vi.fn(),
    getFeatureFlagWithExposureLoggingDisabled: vi.fn(),
    useExperimentGroupNameWithLoading: vi.fn(),
    useExperimentGroupName: vi.fn(),
    useExperimentValue: vi.fn(),
    getExperimentValue: vi.fn(),
    useExperimentValueWithExposureLoggingDisabled: vi.fn(),
    useDynamicConfigValue: vi.fn((args: { defaultValue: unknown }) => args.defaultValue),
    getDynamicConfigValue: vi.fn((args: { defaultValue: unknown }) => args.defaultValue),
    getExperimentValueFromLayer: vi.fn(),
    useExperimentValueFromLayer: vi.fn(),
    checkTypeGuard: vi.fn(),
    useStatsigClientStatus: vi.fn(),
  }
})

const useQueryStateMock = mocked(useQueryState) as unknown as ReturnType<typeof vi.fn>
const useQueryStatesMock = mocked(useQueryStates)
const useCurrencyWithLoadingMock = mocked(useCurrencyWithLoading)
const useFeatureFlagMock = mocked(useFeatureFlag)
const useStatsigClientStatusMock = mocked(useStatsigClientStatus)
const selectIsTestnetModeEnabledMock = mocked(selectIsTestnetModeEnabled)

/** USDG on Robinhood Chain — a token that only exists on a chain behind a rollout flag. */
const USDG_ROBINHOOD = new Token(
  UniverseChainId.Robinhood,
  '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
  6,
  'USDG',
  'Global Dollar',
)

function setStatsigReady(isStatsigReady: boolean): void {
  useStatsigClientStatusMock.mockReturnValue({
    isStatsigReady,
    isStatsigLoading: !isStatsigReady,
    isStatsigUninitialized: !isStatsigReady,
  })
}

function setEnabledRolloutFlags(enabled: FeatureFlags[]): void {
  useFeatureFlagMock.mockImplementation((flag: FeatureFlags) => enabled.includes(flag))
}

/** Stands in for nuqs' URL writer, so tests can assert what would have been written to `?chain=`. */
const setReplaceStateMock = vi.fn()

function setUrlState(chain: UniverseChainId | null, currencyA: string): void {
  useQueryStatesMock.mockReturnValue([
    {
      currencyA,
      currencyB: '',
      chain,
      fee: DEFAULT_FEE_DATA,
      hook: null,
      priceRangeState: {},
      depositState: {},
    },
    setReplaceStateMock,
  ] as unknown as ReturnType<typeof useQueryStates>)
}

/** Mimics the mount effect in `CreateLiquidityContextProvider`, which is what actually rewrites the URL. */
function runUrlSync(state: ReturnType<typeof useLiquidityUrlState>): void {
  state.syncToUrl({
    currencyInputs: { tokenA: state.tokenA, tokenB: state.tokenB },
    positionState: {},
    priceRangeState: {},
    depositState: {},
  })
}

/** The `chain` values written back to the URL, in order. */
function syncedChains(): unknown[] {
  return setReplaceStateMock.mock.calls.map((call) => call[0]?.chain)
}

/** The chainIds `useCurrencyValidation` asked the token loader for. */
function requestedChainIds(): (number | undefined)[] {
  return useCurrencyWithLoadingMock.mock.calls.map((call) => call[0].chainId)
}

/** The addresses `useCurrencyValidation` asked the token loader for. */
function requestedAddresses(): (string | undefined)[] {
  return useCurrencyWithLoadingMock.mock.calls.map((call) => call[0].address)
}

describe('useLiquidityUrlState — chain rollout flags', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // `syncToUrl` no-ops off the create-position routes, which would make every URL-write assertion vacuous.
    window.history.replaceState(null, '', '/positions/add/new')

    useQueryStateMock.mockReturnValue([PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER, vi.fn()])

    useCurrencyWithLoadingMock.mockImplementation(
      ({ address }: { address?: string; chainId?: number }, options?: { skip?: boolean }) => {
        if (options?.skip || address !== USDG_ROBINHOOD.address) {
          return { currency: undefined, loading: false }
        }
        return { currency: USDG_ROBINHOOD, loading: false }
      },
    )

    setStatsigReady(true)
    setEnabledRolloutFlags([])
    selectIsTestnetModeEnabledMock.mockReturnValue(false)
  })

  it('holds the URL chain while Statsig is still initializing instead of falling back to the default chain', () => {
    // Cold load: Statsig has not resolved, so every rollout flag reads as its `false` default.
    setStatsigReady(false)
    setEnabledRolloutFlags([])
    setUrlState(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)

    const { result } = renderHook(() => useLiquidityUrlState())

    expect(result.current.chainId).toBe(UniverseChainId.Robinhood)
    // The preset currency must not be dropped from the request, and must target the URL's chain — its
    // resolution is deferred until the chain is confirmed (see the skip test below).
    expect(requestedAddresses()).toContain(USDG_ROBINHOOD.address)
    expect(requestedChainIds().every((chainId) => chainId === UniverseChainId.Robinhood)).toBe(true)
    // The flow stays unmounted so consumers cannot latch onto a provisional chain or a half-resolved token.
    expect(result.current.loading).toBe(true)
  })

  it('resolves to the URL chain once Statsig reports the rollout flag as enabled', () => {
    setStatsigReady(true)
    setEnabledRolloutFlags([FeatureFlags.Robinhood])
    setUrlState(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)

    const { result } = renderHook(() => useLiquidityUrlState())

    expect(result.current.chainId).toBe(UniverseChainId.Robinhood)
    expect(result.current.tokenA).toEqual(USDG_ROBINHOOD)
    expect(result.current.loading).toBe(false)
  })

  it('still falls back to the default chain and clears currency params when the chain is genuinely disabled', () => {
    setStatsigReady(true)
    setEnabledRolloutFlags([])
    setUrlState(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)

    const { result } = renderHook(() => useLiquidityUrlState())

    expect(result.current.chainId).toBe(UniverseChainId.Mainnet)
    expect(requestedAddresses()).not.toContain(USDG_ROBINHOOD.address)
    expect(result.current.tokenA).toEqual(nativeOnChain(UniverseChainId.Mainnet))
    expect(result.current.loading).toBe(false)
  })

  it('does not hold chains that are not behind a rollout flag while Statsig initializes', () => {
    setStatsigReady(false)
    setEnabledRolloutFlags([])
    setUrlState(UniverseChainId.Base, '')

    const { result } = renderHook(() => useLiquidityUrlState())

    expect(result.current.chainId).toBe(UniverseChainId.Base)
    expect(result.current.loading).toBe(false)
  })

  it('does not hold an unsupported chain that is not behind a rollout flag', () => {
    // Sepolia is unsupported with testnet mode off. Statsig readiness cannot change that, so holding would
    // blank the page for an init round-trip and then land on the same fallback.
    setStatsigReady(false)
    setEnabledRolloutFlags([])
    setUrlState(UniverseChainId.Sepolia, '')

    const { result } = renderHook(() => useLiquidityUrlState())

    expect(result.current.chainId).toBe(UniverseChainId.Mainnet)
    expect(result.current.loading).toBe(false)
  })

  it('does not hold a mainnet rollout chain while testnet mode is on', () => {
    // Testnet mode excludes mainnets outright, whatever their flag says, so waiting for Statsig could only
    // delay the same fallback.
    selectIsTestnetModeEnabledMock.mockReturnValue(true)
    setStatsigReady(false)
    setEnabledRolloutFlags([])
    setUrlState(UniverseChainId.Linea, '')

    const { result } = renderHook(() => useLiquidityUrlState())

    expect(result.current.chainId).toBe(UniverseChainId.Sepolia)
    expect(result.current.loading).toBe(false)
  })

  it('skips the token lookup entirely while the chain is held', () => {
    setStatsigReady(false)
    setEnabledRolloutFlags([])
    setUrlState(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)

    renderHook(() => useLiquidityUrlState())

    // A lookup here would resolve against the default chain (the URL's chain still reads as not-enabled)
    // and its result would then be served as placeholder data for the real, post-hold lookup.
    expect(useCurrencyWithLoadingMock).not.toHaveBeenCalledWith(expect.anything(), { skip: false })
    expect(useCurrencyWithLoadingMock.mock.calls.every((call) => call[1]?.skip === true)).toBe(true)
  })

  describe('readiness transitions', () => {
    it('resolves to the URL chain and never rewrites it when readiness arrives with the flag on', () => {
      setStatsigReady(false)
      setEnabledRolloutFlags([])
      setUrlState(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)

      const { result, rerender } = renderHook(() => useLiquidityUrlState())

      expect(result.current.chainId).toBe(UniverseChainId.Robinhood)
      expect(result.current.loading).toBe(true)

      // A sync attempted during the hold must not write anything.
      act(() => runUrlSync(result.current))
      expect(setReplaceStateMock).not.toHaveBeenCalled()

      setStatsigReady(true)
      setEnabledRolloutFlags([FeatureFlags.Robinhood])
      rerender()

      expect(result.current.chainId).toBe(UniverseChainId.Robinhood)
      expect(result.current.tokenA).toEqual(USDG_ROBINHOOD)
      expect(result.current.loading).toBe(false)

      act(() => runUrlSync(result.current))
      expect(syncedChains()).toEqual([UniverseChainId.Robinhood])
      expect(syncedChains()).not.toContain(UniverseChainId.Mainnet)
    })

    it('falls back exactly as before when readiness arrives with the flag off', () => {
      setStatsigReady(false)
      setEnabledRolloutFlags([])
      setUrlState(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)

      const { result, rerender } = renderHook(() => useLiquidityUrlState())

      expect(result.current.chainId).toBe(UniverseChainId.Robinhood)

      setStatsigReady(true)
      rerender()

      // The provisional chain must not have been latched by the mount effect.
      expect(result.current.chainId).toBe(UniverseChainId.Mainnet)
      expect(result.current.tokenA).toEqual(nativeOnChain(UniverseChainId.Mainnet))
      expect(result.current.loading).toBe(false)

      act(() => runUrlSync(result.current))
      expect(syncedChains()).toEqual([UniverseChainId.Mainnet])
    })

    it('keeps syncing to the URL when readiness regresses after mount', () => {
      setStatsigReady(true)
      setEnabledRolloutFlags([FeatureFlags.Robinhood])
      setUrlState(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)

      const { result, rerender } = renderHook(() => useLiquidityUrlState())

      expect(result.current.loading).toBe(false)

      // `useSyncStatsigUserIdentifiers` calls `updateUserAsync` on wallet connect, which re-enters the
      // `Loading` status and drops cached gate values until the new user's values land.
      setStatsigReady(false)
      setEnabledRolloutFlags([])
      rerender()

      // The form is already mounted and holds real tokens, so edits in this window must still reach the URL.
      act(() =>
        result.current.syncToUrl({
          currencyInputs: { tokenA: USDG_ROBINHOOD, tokenB: undefined },
          positionState: {},
          priceRangeState: {},
          depositState: {},
        }),
      )

      expect(syncedChains()).toEqual([UniverseChainId.Robinhood])
      expect(result.current.loading).toBe(false)
    })
  })

  describe('readiness timeout', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('releases the hold into the default-chain fallback when readiness never arrives', () => {
      setStatsigReady(false)
      setEnabledRolloutFlags([])
      setUrlState(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)

      const { result } = renderHook(() => useLiquidityUrlState())

      expect(result.current.chainId).toBe(UniverseChainId.Robinhood)
      expect(result.current.loading).toBe(true)

      act(() => {
        vi.advanceTimersByTime(CHAIN_ROLLOUT_READINESS_TIMEOUT_MS)
      })

      // Statsig is still not ready — the page must render on the fallback rather than stay blank forever.
      expect(result.current.loading).toBe(false)
      expect(result.current.chainId).toBe(UniverseChainId.Mainnet)
      expect(result.current.tokenA).toEqual(nativeOnChain(UniverseChainId.Mainnet))
    })

    it('keeps holding right up to the timeout', () => {
      setStatsigReady(false)
      setEnabledRolloutFlags([])
      setUrlState(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)

      const { result } = renderHook(() => useLiquidityUrlState())

      act(() => {
        vi.advanceTimersByTime(CHAIN_ROLLOUT_READINESS_TIMEOUT_MS - 1)
      })

      expect(result.current.chainId).toBe(UniverseChainId.Robinhood)
      expect(result.current.loading).toBe(true)
    })

    it('clears the timer on unmount', () => {
      setStatsigReady(false)
      setEnabledRolloutFlags([])
      setUrlState(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)

      // The render tree schedules timers of its own, so match this hook's by its distinctive delay rather
      // than by a global pending-timer count.
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

      const { unmount } = renderHook(() => useLiquidityUrlState())

      const holdTimerIndex = setTimeoutSpy.mock.calls.findIndex(
        (call) => call[1] === CHAIN_ROLLOUT_READINESS_TIMEOUT_MS,
      )
      expect(holdTimerIndex).toBeGreaterThanOrEqual(0)

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalledWith(setTimeoutSpy.mock.results[holdTimerIndex]?.value)
    })
  })
})
