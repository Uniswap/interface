import { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags } from '@universe/gating'
import { getWalletBalancesQuery, PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  usePortfolioBalanceBreakdown,
  usePortfolioBalancePart,
  usePortfolioTotalValue,
} from 'uniswap/src/features/dataApi/balances/usePortfolioBalancePart'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const {
  mockUseEnabledChains,
  mockUseCurrencyIdToVisibility,
  mockUseGetWalletBalancesQuery,
  mockUseHideSmallBalancesSetting,
  mockUseHideSpamTokensSetting,
  mockUsePlatformBasedFetchPolicy,
  mockUseFeatureFlag,
} = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseCurrencyIdToVisibility: vi.fn(),
  mockUseGetWalletBalancesQuery: vi.fn(),
  mockUseHideSmallBalancesSetting: vi.fn(),
  mockUseHideSpamTokensSetting: vi.fn(),
  mockUsePlatformBasedFetchPolicy: vi.fn(),
  mockUseFeatureFlag: vi.fn(),
}))

vi.mock('uniswap/src/data/rest/getWalletBalances/getWalletBalances', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/rest/getWalletBalances/getWalletBalances')>()),
  useGetWalletBalancesQuery: mockUseGetWalletBalancesQuery,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/features/settings/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/settings/hooks')>()),
  useHideSmallBalancesSetting: mockUseHideSmallBalancesSetting,
  useHideSpamTokensSetting: mockUseHideSpamTokensSetting,
}))

vi.mock('uniswap/src/features/transactions/selectors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/transactions/selectors')>()),
  useCurrencyIdToVisibility: mockUseCurrencyIdToVisibility,
}))

vi.mock('uniswap/src/utils/usePlatformBasedFetchPolicy', () => ({
  usePlatformBasedFetchPolicy: mockUsePlatformBasedFetchPolicy,
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
  // useWalletBalancesIncludeCategories reads the pools flag via the exposure-disabled variant.
  useFeatureFlagWithExposureLoggingDisabled: mockUseFeatureFlag,
}))

// `useGetWalletBalancesQuery` returns a shape compatible with `UseQueryResult`. The hook reads
// `data`/`isFetching`/`status`/`error`/`refetch`/`dataUpdatedAt`, so the mocks only need those fields.
const WALLET_BALANCES_BY_PART = {
  total: { balanceUSD: 1300, percentChange: 3, absoluteChangeUSD: 100 },
  tokens: { balanceUSD: 1000, percentChange: 2, absoluteChangeUSD: 50 },
  pools: { balanceUSD: 300, percentChange: 5, absoluteChangeUSD: 50 },
} as const

const makeQueryResult = <T>(
  data: T,
): {
  data: T
  isFetching: boolean
  refetch: ReturnType<typeof vi.fn>
  error: null
  status: 'success'
  dataUpdatedAt: number
} => ({
  data,
  isFetching: false,
  refetch: vi.fn(),
  error: null,
  status: 'success',
  dataUpdatedAt: 1710000000000,
})

describe(usePortfolioBalancePart, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet] })
    mockUsePlatformBasedFetchPolicy.mockReturnValue({ pollInterval: false })
    mockUseCurrencyIdToVisibility.mockReturnValue({})
    mockUseHideSmallBalancesSetting.mockReturnValue(false)
    mockUseHideSpamTokensSetting.mockReturnValue(false)

    // The GetWalletBalances mock honours the `select` so the test exercises the real selector
    // routing inside `selectorForPart` end-to-end.
    mockUseGetWalletBalancesQuery.mockImplementation(({ select }) => {
      const rawResponse = {
        balance: {
          total: { valueUsd: 1300, percentChange1d: 3, absoluteChange1d: 100 },
          tokens: { valueUsd: 1000, percentChange1d: 2, absoluteChange1d: 50 },
          pools: { valueUsd: 300, percentChange1d: 5, absoluteChange1d: 50 },
          failedChainIds: [],
        },
      }
      return makeQueryResult(select ? select(rawResponse) : rawResponse)
    })
  })

  describe('tokens-only default (flag off)', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(false)
    })

    it('always uses GetWalletBalances (no GetPortfolio fallback)', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Tokens, evmAddress: '0x123' }))

      expect(mockUseGetWalletBalancesQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
    })

    it('sends an empty include_categories array (tokens-only)', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      const input = mockUseGetWalletBalancesQuery.mock.calls.at(-1)?.[0]?.input
      expect(input?.includeCategories).toEqual([])
    })

    it.each([PortfolioBalancePart.Total, PortfolioBalancePart.Tokens, PortfolioBalancePart.Pools])(
      'resolves part="%s" to the matching GetWalletBalances part',
      (part) => {
        const { result } = renderHookWithProviders(() => usePortfolioBalancePart({ part, evmAddress: '0x123' }))

        expect(result.current.data).toEqual(WALLET_BALANCES_BY_PART[part])
      },
    )
  })

  describe('pools opted in (flag on)', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.PortfolioPoolsBalances)
    })

    it('sends include_categories=[POOLS]', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      const input = mockUseGetWalletBalancesQuery.mock.calls.at(-1)?.[0]?.input
      expect(input?.includeCategories).toEqual([WalletBalanceCategory.POOLS])
    })

    it.each([PortfolioBalancePart.Total, PortfolioBalancePart.Tokens, PortfolioBalancePart.Pools])(
      'resolves part="%s" to the matching GetWalletBalances part',
      (part) => {
        const { result } = renderHookWithProviders(() => usePortfolioBalancePart({ part, evmAddress: '0x123' }))

        expect(result.current.data).toEqual(WALLET_BALANCES_BY_PART[part])
      },
    )

    it('only enables the GetWalletBalances query when an address is provided', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Tokens, evmAddress: '0x123' }))

      expect(mockUseGetWalletBalancesQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
    })

    it('returns differentiated data across the three parts', () => {
      const { result: total } = renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }),
      )
      const { result: tokens } = renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Tokens, evmAddress: '0x123' }),
      )
      const { result: pools } = renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Pools, evmAddress: '0x123' }),
      )

      expect(total.current.data?.balanceUSD).toBe(1300)
      expect(tokens.current.data?.balanceUSD).toBe(1000)
      expect(pools.current.data?.balanceUSD).toBe(300)
      expect(total.current.data).not.toEqual(tokens.current.data)
      expect(tokens.current.data).not.toEqual(pools.current.data)
    })

    it('re-projects to the new part when part changes on a mounted hook', () => {
      // Model the React Query contract that the consumer hook actually relies on:
      // `select` is only re-invoked when its function reference changes between renders.
      // Stable references re-use the previously projected value (which is the failure mode
      // we are guarding against here).
      const rawResponse = {
        balance: {
          total: { valueUsd: 1300, percentChange1d: 3, absoluteChange1d: 100 },
          tokens: { valueUsd: 1000, percentChange1d: 2, absoluteChange1d: 50 },
          pools: { valueUsd: 300, percentChange1d: 5, absoluteChange1d: 50 },
          failedChainIds: [],
        },
      }
      let lastSelect: ((data: unknown) => unknown) | undefined
      let lastProjected: unknown
      mockUseGetWalletBalancesQuery.mockImplementation(({ select }) => {
        if (select !== lastSelect) {
          lastSelect = select
          lastProjected = select ? select(rawResponse) : rawResponse
        }
        return makeQueryResult(lastProjected)
      })

      const { result, rerender } = renderHookWithProviders(
        (props: { part: PortfolioBalancePart }) => usePortfolioBalancePart({ part: props.part, evmAddress: '0x123' }),
        { initialProps: [{ part: PortfolioBalancePart.Tokens }] },
      )

      expect(result.current.data).toEqual(WALLET_BALANCES_BY_PART.tokens)

      rerender([{ part: PortfolioBalancePart.Pools }])

      expect(result.current.data).toEqual(WALLET_BALANCES_BY_PART.pools)
    })
  })

  it('passes the network/error/refetch metadata through unchanged', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.PortfolioPoolsBalances)
    mockUseGetWalletBalancesQuery.mockReturnValue({
      data: undefined,
      isFetching: false,
      refetch: vi.fn(),
      error: new Error('Network error'),
      status: 'error',
      dataUpdatedAt: 0,
    })

    const { result } = renderHookWithProviders(() =>
      usePortfolioBalancePart({ part: PortfolioBalancePart.Tokens, evmAddress: '0x123' }),
    )

    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toEqual(expect.any(Error))
    expect(result.current.dataUpdatedAt).toBeUndefined()
  })

  describe('query contract preservation', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(false)
    })

    const EXPECTED_MAINNET_MODIFIER = {
      address: '0x123',
      includeOverrides: [],
      excludeOverrides: [],
      poolIncludeOverrides: [],
      poolExcludeOverrides: [],
      includeSmallBalances: true,
      includeSpamTokens: true,
    }

    it('forwards evmAddress, svmAddress, default chainIds, include_categories, and the REST modifier as input', () => {
      renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123', svmAddress: 'svm456' }),
      )

      expect(mockUseGetWalletBalancesQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            evmAddress: '0x123',
            svmAddress: 'svm456',
            chainIds: [UniverseChainId.Mainnet],
            includeCategories: [],
            modifier: EXPECTED_MAINNET_MODIFIER,
          },
        }),
      )
    })

    it('uses explicit chainIds when provided and falls back to useEnabledChains otherwise', () => {
      renderHookWithProviders(() =>
        usePortfolioBalancePart({
          part: PortfolioBalancePart.Total,
          evmAddress: '0x123',
          chainIds: [UniverseChainId.Optimism, UniverseChainId.ArbitrumOne],
        }),
      )

      expect(mockUseGetWalletBalancesQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            chainIds: [UniverseChainId.Optimism, UniverseChainId.ArbitrumOne],
          }),
        }),
      )

      mockUseGetWalletBalancesQuery.mockClear()

      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      expect(mockUseGetWalletBalancesQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            chainIds: [UniverseChainId.Mainnet],
          }),
        }),
      )
    })

    it('enables the query when an address is provided and enabled is not explicitly false', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      expect(mockUseGetWalletBalancesQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true }))
    })

    it('disables the query when no evm/svm address is provided', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total }))

      expect(mockUseGetWalletBalancesQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
    })

    it('disables the query when enabled: false is passed even with an address', () => {
      renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123', enabled: false }),
      )

      expect(mockUseGetWalletBalancesQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
    })

    it('forwards cacheOnly so readers can watch the cache without fetching', () => {
      renderHookWithProviders(() =>
        usePortfolioBalancePart({
          part: PortfolioBalancePart.Total,
          evmAddress: '0x123',
          cacheOnly: true,
        }),
      )

      expect(mockUseGetWalletBalancesQuery).toHaveBeenLastCalledWith(expect.objectContaining({ cacheOnly: true }))
    })

    it('still forwards the modifier when the query is disabled', () => {
      // All observers for an address share one query (modifier is excluded from the key), so a disabled
      // observer must keep forwarding the modifier or it clobbers the shared queryFn for the others.
      renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123', enabled: false }),
      )

      expect(mockUseGetWalletBalancesQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          enabled: false,
          input: expect.objectContaining({ modifier: EXPECTED_MAINNET_MODIFIER }),
        }),
      )
    })

    it('forwards refetchInterval from usePlatformBasedFetchPolicy', () => {
      mockUsePlatformBasedFetchPolicy.mockReturnValue({ pollInterval: 15_000 })

      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      expect(mockUseGetWalletBalancesQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ refetchInterval: 15_000 }),
      )
    })

    it('passes a select callback that returns undefined for an undefined or balance-less response', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      const callArgs = mockUseGetWalletBalancesQuery.mock.calls.at(-1)?.[0]
      expect(callArgs?.select(undefined)).toBeUndefined()
      expect(callArgs?.select({ balance: undefined })).toBeUndefined()
    })

    it('passes a select callback that maps the GetWalletBalances total to {balanceUSD, percentChange, absoluteChangeUSD}', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      const callArgs = mockUseGetWalletBalancesQuery.mock.calls.at(-1)?.[0]
      expect(
        callArgs?.select({
          balance: {
            total: { valueUsd: 250, percentChange1d: -3.5, absoluteChange1d: -10 },
          },
        }),
      ).toEqual({
        balanceUSD: 250,
        percentChange: -3.5,
        absoluteChangeUSD: -10,
      })
    })
  })
})

describe(usePortfolioTotalValue, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet] })
    mockUsePlatformBasedFetchPolicy.mockReturnValue({ pollInterval: false })
    mockUseCurrencyIdToVisibility.mockReturnValue({})
    mockUseHideSmallBalancesSetting.mockReturnValue(false)
    mockUseHideSpamTokensSetting.mockReturnValue(false)
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseGetWalletBalancesQuery.mockReturnValue(makeQueryResult(undefined))
  })

  it('returns the same shape as usePortfolioBalancePart({ part: "total" }) (wrapper smoke test)', () => {
    const { result: wrapped } = renderHookWithProviders(() => usePortfolioTotalValue({ evmAddress: '0x123' }))
    const { result: canonical } = renderHookWithProviders(() =>
      usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }),
    )

    expect(wrapped.current.data).toEqual(canonical.current.data)
    expect(wrapped.current.loading).toBe(canonical.current.loading)
    expect(wrapped.current.networkStatus).toEqual(canonical.current.networkStatus)
  })
})

describe(usePortfolioBalanceBreakdown, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet] })
    mockUsePlatformBasedFetchPolicy.mockReturnValue({ pollInterval: false })
    mockUseCurrencyIdToVisibility.mockReturnValue({})
    mockUseHideSmallBalancesSetting.mockReturnValue(false)
    mockUseHideSpamTokensSetting.mockReturnValue(false)

    mockUseGetWalletBalancesQuery.mockImplementation(({ select }) => {
      const rawResponse = {
        balance: {
          total: { valueUsd: 1300, percentChange1d: 3, absoluteChange1d: 100 },
          tokens: { valueUsd: 1000, percentChange1d: 2, absoluteChange1d: 50 },
          pools: { valueUsd: 300, percentChange1d: 5, absoluteChange1d: 50 },
          failedChainIds: [],
        },
      }
      return makeQueryResult(select ? select(rawResponse) : rawResponse)
    })
  })

  const EXPECTED_BREAKDOWN = {
    total: { balanceUSD: 1300, percentChange: 3, absoluteChangeUSD: 100 },
    tokens: { balanceUSD: 1000, percentChange: 2, absoluteChangeUSD: 50 },
    pools: { balanceUSD: 300, percentChange: 5, absoluteChangeUSD: 50 },
    failedChainIds: [],
  }

  it('enables the query and returns the full breakdown with [POOLS] in requestedCategories when the flag is on', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.PortfolioPoolsBalances)

    const { result } = renderHookWithProviders(() => usePortfolioBalanceBreakdown({ evmAddress: '0x123' }))

    expect(mockUseGetWalletBalancesQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
    expect(result.current.data).toEqual(EXPECTED_BREAKDOWN)
    expect(result.current.requestedCategories).toEqual([WalletBalanceCategory.POOLS])
  })

  it('still enables the query and returns data with empty requestedCategories when the flag is off', () => {
    mockUseFeatureFlag.mockReturnValue(false)

    const { result } = renderHookWithProviders(() => usePortfolioBalanceBreakdown({ evmAddress: '0x123' }))

    expect(mockUseGetWalletBalancesQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
    expect(result.current.data).toEqual(EXPECTED_BREAKDOWN)
    expect(result.current.requestedCategories).toEqual([])
  })

  it('disables the query when no evm/svm address is provided', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.PortfolioPoolsBalances)

    renderHookWithProviders(() => usePortfolioBalanceBreakdown({}))

    expect(mockUseGetWalletBalancesQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('passes the same input shape as usePortfolioBalancePart so query keys stay aligned', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.PortfolioPoolsBalances)

    renderHookWithProviders(() =>
      usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123', svmAddress: 'svm456' }),
    )
    const partInput = mockUseGetWalletBalancesQuery.mock.calls.at(-1)?.[0]?.input
    expect(partInput).toBeDefined()

    mockUseGetWalletBalancesQuery.mockClear()

    renderHookWithProviders(() => usePortfolioBalanceBreakdown({ evmAddress: '0x123', svmAddress: 'svm456' }))
    const breakdownInput = mockUseGetWalletBalancesQuery.mock.calls.at(-1)?.[0]?.input
    expect(breakdownInput).toBeDefined()

    expect(breakdownInput).toEqual(partInput)
    expect(getWalletBalancesQuery({ input: breakdownInput }).queryKey).toEqual(
      getWalletBalancesQuery({ input: partInput }).queryKey,
    )
  })

  it('passes through query metadata (loading/error/refetch) from the underlying query', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.PortfolioPoolsBalances)
    const refetch = vi.fn()
    mockUseGetWalletBalancesQuery.mockReturnValue({
      data: undefined,
      isFetching: true,
      refetch,
      error: new Error('Network error'),
      status: 'error',
      dataUpdatedAt: 0,
    })

    const { result } = renderHookWithProviders(() => usePortfolioBalanceBreakdown({ evmAddress: '0x123' }))

    expect(result.current.data).toBeUndefined()
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toEqual(expect.any(Error))
    expect(result.current.refetch).toBe(refetch)
  })
})
