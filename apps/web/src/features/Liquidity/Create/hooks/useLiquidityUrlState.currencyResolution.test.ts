import type { UseQueryResult } from '@tanstack/react-query'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag, useStatsigClientStatus } from '@universe/gating'
import { useQueryState, useQueryStates } from 'nuqs'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { vi } from 'vitest'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import { DEFAULT_FEE_DATA, PositionFlowStep } from '~/features/Liquidity/Create/types'
import { mocked } from '~/test-utils/mocked'
import { renderHook } from '~/test-utils/render'

/**
 * Unlike the sibling `chainRollout` suite, this one deliberately does NOT mock `~/hooks/Tokens`. The
 * behavior under test lives inside it: `useCurrencyPreprocessing` re-resolves the chain through
 * `useSupportedChainId` and builds the cache key from the result, so while a rollout chain reads as
 * not-enabled the lookup silently retargets the default chain. Mocking the loader would hide exactly that.
 */
vi.mock('nuqs', async () => {
  const actual = await vi.importActual('nuqs')
  return {
    ...actual,
    useQueryState: vi.fn(),
    useQueryStates: vi.fn(),
  }
})

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useCurrencyInfo: vi.fn(),
    useCurrencyInfoWithLoading: vi.fn(),
  }
})

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
const useFeatureFlagMock = mocked(useFeatureFlag)
const useStatsigClientStatusMock = mocked(useStatsigClientStatus)
const useCurrencyInfoWithLoadingMock = mocked(useCurrencyInfoWithLoading)

const USDG_ROBINHOOD = new Token(
  UniverseChainId.Robinhood,
  '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
  6,
  'USDG',
  'Global Dollar',
)

const ROBINHOOD_CURRENCY_ID = buildCurrencyId(UniverseChainId.Robinhood, USDG_ROBINHOOD.address)
const MAINNET_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, USDG_ROBINHOOD.address)

function setStatsigReady(isStatsigReady: boolean): void {
  useStatsigClientStatusMock.mockReturnValue({
    isStatsigReady,
    isStatsigLoading: !isStatsigReady,
    isStatsigUninitialized: !isStatsigReady,
  })
}

/** Settled React Query result for the mocked `useCurrencyInfoWithLoading`; only `data`/`isLoading` are read. */
function queryResult(data: Maybe<CurrencyInfo>): UseQueryResult<Maybe<CurrencyInfo>> {
  return { data, isLoading: false } as UseQueryResult<Maybe<CurrencyInfo>>
}

/** currencyIds the app actually asked the data layer to resolve (skipped lookups excluded). */
function requestedCurrencyIds(): (string | undefined)[] {
  return useCurrencyInfoWithLoadingMock.mock.calls.filter((call) => call[1]?.skip !== true).map((call) => call[0])
}

describe('useLiquidityUrlState — currency resolution across the chain hold', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState(null, '', '/positions/add/new')

    useQueryStateMock.mockReturnValue([PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER, vi.fn()])

    useQueryStatesMock.mockReturnValue([
      {
        currencyA: USDG_ROBINHOOD.address,
        currencyB: '',
        chain: UniverseChainId.Robinhood,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ] as unknown as ReturnType<typeof useQueryStates>)

    // Only the Robinhood-keyed lookup can ever resolve this token.
    useCurrencyInfoWithLoadingMock.mockImplementation((currencyId?: string, options?: { skip?: boolean }) => {
      if (options?.skip || currencyId !== ROBINHOOD_CURRENCY_ID) {
        return queryResult(undefined)
      }
      return queryResult({ currency: USDG_ROBINHOOD } as CurrencyInfo)
    })

    useFeatureFlagMock.mockImplementation(() => false)
  })

  it('never resolves the preset token against the default chain while the rollout chain is held', () => {
    setStatsigReady(false)

    renderHook(() => useLiquidityUrlState())

    // The bug this guards: `useSupportedChainId` returns undefined for a not-yet-enabled rollout chain, so
    // an unskipped lookup here would be keyed to Mainnet and its result reused as placeholder data later.
    expect(requestedCurrencyIds()).not.toContain(MAINNET_CURRENCY_ID)
  })

  it('resolves the preset token on the rollout chain once readiness arrives', () => {
    setStatsigReady(false)

    const { result, rerender } = renderHook(() => useLiquidityUrlState())

    expect(result.current.loading).toBe(true)

    setStatsigReady(true)
    useFeatureFlagMock.mockImplementation((flag: FeatureFlags) => flag === FeatureFlags.Robinhood)
    rerender()

    expect(result.current.chainId).toBe(UniverseChainId.Robinhood)
    expect(requestedCurrencyIds()).toContain(ROBINHOOD_CURRENCY_ID)
    expect(result.current.tokenA).toEqual(USDG_ROBINHOOD)
    expect(result.current.loading).toBe(false)
  })
})
